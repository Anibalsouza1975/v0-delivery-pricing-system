const { createServer } = require("http")
const { parse } = require("url")
const next = require("next")

const dev = process.env.NODE_ENV !== "production"
const hostname = process.env.HOSTNAME || "0.0.0.0"
const port = process.env.PORT || 3001

const app = next({
  dev,
  hostname: dev ? "localhost" : hostname,
  port,
  conf: {
    // Configurações específicas para produção
    compress: true,
    poweredByHeader: false,
  },
})
const handle = app.getRequestHandler()

console.log(`🚀 Iniciando Cartago Sistema em ${dev ? "desenvolvimento" : "produção"}`)
console.log(`📍 Servidor: ${hostname}:${port}`)

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      if (!dev) {
        res.setHeader("X-Powered-By", "Cartago Sistema")
        res.setHeader("X-Frame-Options", "DENY")
        res.setHeader("X-Content-Type-Options", "nosniff")
      }

      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error("❌ Erro ao processar requisição:", req.url, err)
      res.statusCode = 500
      res.end("Erro interno do servidor")
    }
  })
    .once("error", (err) => {
      console.error("❌ Erro crítico do servidor:", err)
      process.exit(1)
    })
    .listen(port, hostname, () => {
      console.log(`✅ Cartago Sistema rodando em http://${hostname}:${port}`)
      console.log(`📊 Ambiente: ${process.env.NODE_ENV}`)
      console.log(`🔧 PM2: ${process.env.PM2_HOME ? "Ativo" : "Inativo"}`)
    })
})
