require('dotenv').config()

const path = require('path')
const express = require('express')
const exphbs = require('express-handlebars')
const nodemailer = require('nodemailer')
const app = express()
const port = process.env.PORT || 3000
const contatosRecebidos = []

function buildSeo(req, pageTitle, metaDescription, pagePath) {
    const baseUrl = `${req.protocol}://${req.get('host')}`
    return {
        pageTitle,
        metaDescription,
        socialImage: `${baseUrl}/img/comida1.jpg`,
        pageUrl: `${baseUrl}${pagePath}`
    }
}

function getSmtpConfig() {
    const host = process.env.SMTP_HOST
    const portNumber = Number(process.env.SMTP_PORT || 587)
    const user = process.env.SMTP_USER
    const pass = process.env.SMTP_PASS

    const hasPlaceholderUser = (user || '').includes('seuemail') || (user || '').includes('seu_usuario')
    const hasPlaceholderPass = (pass || '').includes('senha') || (pass || '').includes('digitos')

    if (!host || !portNumber || !user || !pass || hasPlaceholderUser || hasPlaceholderPass) {
        return null
    }

    return {
        host,
        port: portNumber,
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user, pass }
    }
}

async function sendContactEmail({ nome, email, mensagem }) {
    const smtpConfig = getSmtpConfig()

    if (!smtpConfig) {
        return { sent: false, reason: 'smtp_not_configured' }
    }

    const transporter = nodemailer.createTransport(smtpConfig)
    const to = process.env.CONTACT_TO_EMAIL || smtpConfig.auth.user
    const from = process.env.CONTACT_FROM_EMAIL || smtpConfig.auth.user

    await transporter.sendMail({
        from,
        to,
        subject: `Novo contato no site HORB - ${nome}`,
        text: `Nome: ${nome}\nE-mail: ${email}\n\nMensagem:\n${mensagem}`,
        html: `<h2>Novo contato no site HORB</h2><p><strong>Nome:</strong> ${nome}</p><p><strong>E-mail:</strong> ${email}</p><p><strong>Mensagem:</strong><br>${mensagem}</p>`
    })

    return { sent: true }
}

app.engine('handlebars', exphbs.engine())
app.set('view engine', 'handlebars')
app.set('views', path.join(__dirname, 'views'))
app.use(express.urlencoded({extended: true}))
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.json())

//const basePath = path.join(__dirname, 'templates')

app.get('/', (req,res)=>{
    res.render('index', buildSeo(
        req,
        'HORB | principal',
        'Hotel Ouro Real Brilhante com estrutura diversificada para lazer, negócios e eventos, com foco em excelência e crescimento sustentável.',
        '/'
    ))
})

app.get('/menu', (req,res)=>{
    res.render('menu', buildSeo(
        req,
        'HORB | Menu Oficial',
        'Conheça o menu oficial do Hotel Ouro Real Brilhante com opções executivas, gourmet e experiências gastronômicas premium.',
        '/menu'
    ))
})

app.get('/contato', (req,res)=>{
    res.render('contato', {
        ...buildSeo(
            req,
            'HORB | Contato',
            'Entre em contato com o Hotel Ouro Real Brilhante para reservas, eventos corporativos e atendimento personalizado.',
            '/contato'
        ),
        formData: { nome: '', email: '', mensagem: '' }
    })
})

app.post('/contato', async (req,res)=>{
    const nome = (req.body.nome || '').trim()
    const email = (req.body.email || '').trim()
    const mensagem = (req.body.mensagem || '').trim()

    const renderBase = {
        ...buildSeo(
            req,
            'HORB | Contato',
            'Entre em contato com o Hotel Ouro Real Brilhante para reservas, eventos corporativos e atendimento personalizado.',
            '/contato'
        ),
        formData: { nome, email, mensagem }
    }

    if (!nome || !email || !mensagem) {
        return res.status(400).render('contato', {
            ...renderBase,
            errorMessage: 'Preencha nome, e-mail e mensagem para enviar o contato.'
        })
    }

    contatosRecebidos.push({ nome, email, mensagem, createdAt: new Date().toISOString() })

    try {
        const emailResult = await sendContactEmail({ nome, email, mensagem })

        if (emailResult.reason === 'smtp_not_configured') {
            return res.render('contato', {
                ...renderBase,
                successMessage: 'Mensagem recebida com sucesso! Configure SMTP para habilitar envio real por e-mail.',
                formData: { nome: '', email: '', mensagem: '' }
            })
        }

        return res.render('contato', {
            ...renderBase,
            successMessage: 'Mensagem enviada com sucesso! Em breve nossa equipe entrará em contato.',
            formData: { nome: '', email: '', mensagem: '' }
        })
    } catch (error) {
        return res.status(500).render('contato', {
            ...renderBase,
            errorMessage: 'Não foi possível enviar seu contato por e-mail no momento. Tente novamente em instantes.'
        })
    }
})

if (!process.env.VERCEL) {
    app.listen(port, ()=>{
        console.log(`Servidor rodando na porta ${port}`)
    })
}

module.exports = app
