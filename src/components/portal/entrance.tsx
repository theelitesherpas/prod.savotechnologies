import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { PortalIcon } from "./workspace-ui";
import portal from "./portal.module.css";
import styles from "./entrance.module.css";

/** Focused Savo access, not a sales landing page. Existing editorial image is
 * illustrative, never represented as Savo's office, people or client work. */
export function PortalEntrance({
  kind,
  children,
}: {
  kind: "client" | "employee";
  children: ReactNode;
}) {
  const employee = kind === "employee";
  return (
    <div className={`${portal.loginPage} ${styles.page}`}>
      <div className={styles.gateway}>
        <section className={styles.story} aria-labelledby="access-story">
          <div className={styles.storyCopy}>
            <h2 id="access-story">
              {employee ? (
                <>
                  Good to have
                  <br />
                  you here.
                </>
              ) : (
                <>
                  Built together.
                  <br />
                  Connected here.
                </>
              )}
            </h2>
            <p>
              {employee
                ? "Your people, your work, your place at Savo. Keep your employment details, leave and authored content in view."
                : "A direct connection to the work we’re building with you. Follow your projects, catch up on delivery and keep the details together."}
            </p>
            <ul className={styles.features}>
              {(employee
                ? [
                    "Your employment details",
                    "Leave balance & history",
                    "Your authored content",
                  ]
                : [
                    "Projects & milestones",
                    "Delivery updates",
                    "Invoices & payment history",
                  ]
              ).map((label, index) => (
                <li key={label}>
                  <PortalIcon
                    name={
                      index === 0
                        ? "projects"
                        : index === 1
                          ? "message"
                          : "invoice"
                    }
                  />
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className={styles.image}>
            <Image
              src="/images/contact/conversation-desk.webp"
              alt=""
              fill
              sizes="(max-width: 700px) 100vw, 55vw"
              preload
            />
            <span className={styles.imageCaption}>
              Bold Brands. Built by Savo.
            </span>
          </div>
        </section>
        <div className={styles.formSide}>
          <nav className={styles.switcher} aria-label="Choose your portal">
            <Link href="/portal" aria-current={!employee ? "page" : undefined}>
              Client portal
            </Link>
            <Link
              href="/employee-portal"
              aria-current={employee ? "page" : undefined}
            >
              Employee portal
            </Link>
          </nav>
          {children}
          <div className={styles.accessNote}>
            <PortalIcon name="shield" />
            <span>
              {employee
                ? "For authorised Savo team members."
                : "For clients with a Savo-provided account."}
            </span>
            <Link href="/trust">Trust & security</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
