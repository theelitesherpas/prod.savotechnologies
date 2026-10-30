/** In-memory verification sink. Loopback only; refuses every non-.invalid
 * recipient. Never writes raw email bodies, addresses or tokens to disk. */
import net from "node:net";
export async function localReminderSmtp({ maxMessageBytes = 1_000_000 } = {}) {
  const messages = [], sockets = new Set();
  const server = net.createServer(socket => {
    sockets.add(socket); socket.on("close", () => sockets.delete(socket));
    socket.setEncoding("utf8"); socket.write("220 localhost ESMTP synthetic-reminder-test\r\n");
    let buffer = "", inData = false, recipient = "", sender = "", body = "";
    socket.on("data", chunk => {
      buffer += chunk;
      let end;
      while ((end = buffer.indexOf("\r\n")) >= 0) {
        const line = buffer.slice(0, end); buffer = buffer.slice(end + 2);
        if (inData) {
          if (line === ".") { messages.push({ recipient, body, sender }); body = ""; inData = false; socket.write("250 queued locally\r\n"); }
          else body += `${line}\n`;
        } else if (/^EHLO|^HELO/.test(line)) socket.write(`250-localhost\r\n250-AUTH PLAIN\r\n250 SIZE ${maxMessageBytes}\r\n`);
        else if (/^AUTH PLAIN /.test(line)) socket.write("235 Synthetic authentication accepted\r\n");
        else if (/^MAIL FROM:/.test(line)) { recipient = ""; sender = line.match(/<([^>]+)>/)?.[1] || ""; socket.write("250 OK\r\n"); }
        else if (/^RCPT TO:/.test(line)) { recipient = line.match(/<([^>]+)>/)?.[1] || ""; if (!recipient.endsWith(".invalid")) { recipient = ""; socket.write("550 Synthetic recipients only\r\n"); } else socket.write("250 OK\r\n"); }
        else if (line === "DATA" && recipient) { inData = true; socket.write("354 End with a dot\r\n"); }
        else if (line === "QUIT") socket.end("221 Bye\r\n");
        else if (line === "DATA") socket.write("550 No synthetic recipient\r\n");
        else socket.write("250 OK\r\n");
      }
    });
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  return { messages, port: server.address().port, async close() { for (const socket of sockets) socket.destroy(); await new Promise(resolve => server.close(resolve)); } };
}
