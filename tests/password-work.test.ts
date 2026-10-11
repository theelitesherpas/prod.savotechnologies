import { afterEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";
import { DUMMY_PASSWORD_HASH, hashPassword, PASSWORD_WORK_CAPACITY, passwordFitsBcrypt, verifyPassword } from "@/lib/passwords";
afterEach(() => vi.restoreAllMocks());
describe("async bounded password work", () => {
 it("uses async compare, never hashSync/compareSync", async () => {
  const compare=vi.spyOn(bcrypt,"compare").mockResolvedValue(true as never);
  const sync=vi.spyOn(bcrypt,"hashSync");const syncCompare=vi.spyOn(bcrypt,"compareSync");
  expect(await verifyPassword("input",DUMMY_PASSWORD_HASH)).toBe(true);
  expect(compare).toHaveBeenCalledWith("input",DUMMY_PASSWORD_HASH);expect(sync).not.toHaveBeenCalled();expect(syncCompare).not.toHaveBeenCalled();
 });
 it("accepts the 72-byte boundary but not ASCII/UTF-8 overflow for new hashes", async () => {
  expect(passwordFitsBcrypt("a".repeat(72))).toBe(true);expect(passwordFitsBcrypt("a".repeat(73))).toBe(false);
  expect(passwordFitsBcrypt("界".repeat(24))).toBe(true);expect(passwordFitsBcrypt("界".repeat(25))).toBe(false);
  await expect(hashPassword("a".repeat(73))).rejects.toThrow("PASSWORD_BYTE_LIMIT");
  await expect(hashPassword("界".repeat(25))).rejects.toThrow("PASSWORD_BYTE_LIMIT");
 });
 it("preserves real legacy bcrypt truncation for existing logins only", async () => {
  const legacy="a".repeat(72)+"old suffix";const hash=await bcrypt.hash(legacy,4);
  expect(await verifyPassword(legacy,hash)).toBe(true);expect(await verifyPassword("a".repeat(72),hash)).toBe(true);
  await expect(hashPassword(legacy)).rejects.toThrow("PASSWORD_BYTE_LIMIT");
 });
 it.each(["bad", "$2b$31$"+"a".repeat(53), DUMMY_PASSWORD_HASH+"junk"])("rejects malformed/pathologically expensive hashes", async hash => {
  const compare=vi.spyOn(bcrypt,"compare");expect(await verifyPassword("input",hash)).toBe(false);expect(compare).not.toHaveBeenCalled();
 });
 it("caps simultaneous work without queuing, then recovers", async () => {
  let release!: (value:boolean)=>void;const hold=new Promise<boolean>(r=>{release=r;});
  const compare=vi.spyOn(bcrypt,"compare").mockReturnValue(hold as never);
  const pending=Array.from({length:PASSWORD_WORK_CAPACITY},()=>verifyPassword("input",DUMMY_PASSWORD_HASH));
  expect(await verifyPassword("input",DUMMY_PASSWORD_HASH)).toBe(false);await expect(hashPassword("new password")).rejects.toThrow("PASSWORD_WORK_BUSY");
  expect(compare).toHaveBeenCalledTimes(PASSWORD_WORK_CAPACITY);release(true);expect(await Promise.all(pending)).toEqual(Array(PASSWORD_WORK_CAPACITY).fill(true));
  expect(await verifyPassword("input",DUMMY_PASSWORD_HASH)).toBe(true);
 });
 it("releases capacity when comparison throws", async () => {
  const compare=vi.spyOn(bcrypt,"compare").mockRejectedValue(new Error("failure") as never);
  for(let i=0;i<6;i++)expect(await verifyPassword("input",DUMMY_PASSWORD_HASH)).toBe(false);
  compare.mockResolvedValue(true as never);expect(await verifyPassword("input",DUMMY_PASSWORD_HASH)).toBe(true);
 });
 it("rejects oversized verifier input before work", async () => {
  const compare=vi.spyOn(bcrypt,"compare");expect(await verifyPassword("a".repeat(201),DUMMY_PASSWORD_HASH)).toBe(false);expect(compare).not.toHaveBeenCalled();
 });
});
