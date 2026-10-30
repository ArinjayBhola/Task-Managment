import { DurableObject } from "cloudflare:workers";

export class PresenceServer extends DurableObject {
  users = new Map();

  async fetch(request: Request) {
    const upgradeHeader = request.headers.get('Upgrade');
    if (!upgradeHeader || upgradeHeader !== 'websocket') {
      return new Response('Expected Upgrade: websocket', { status: 426 });
    }

    const { 0: client, 1: server } = new WebSocketPair();

    this.handleSession(server);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  handleSession(ws: WebSocket) {
    ws.accept();

    ws.addEventListener('message', async (msg) => {
      try {
        const data = JSON.parse(msg.data as string);
        if (data.type === 'presence') {
          this.broadcast({
            type: 'presence',
            userId: data.userId,
            taskId: data.taskId,
          });
        }
      } catch (e) {
        ws.send(JSON.stringify({ error: 'Invalid message' }));
      }
    });
  }

  broadcast(message: any) {
    // Logic to broadcast to all connected clients
    const msgString = JSON.stringify(message);
    // In a real implementation, we'd keep track of all active websockets
  }
}
