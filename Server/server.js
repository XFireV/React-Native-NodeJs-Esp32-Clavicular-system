import Fastify, { fastify } from 'fastify'

const app = fastify({logger: true})

const starting = async() => {
    const port = process.env.PORT || 3333

    try {
        await app.listen({ port: Number(port), host: '0.0.0.0' })
        console.log(`port: ${port}`)
    } catch (error) {
        app.log.error(error)
    }
}

app.post("/home", async(req, rep) => {
    console.log(req.body, req.ip)
    return {ligar: 2, estado: "HIGH"}
})

starting()
