require('dotenv').config()
const nodemailer = require('nodemailer')

async function run() {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || 587)
  const secure = process.env.SMTP_SECURE === 'true'
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const to = process.env.TEST_EMAIL_TO || process.env.CONTACT_TO_EMAIL || user
  const from = process.env.CONTACT_FROM_EMAIL || user
  const hasPlaceholderUser = (user || '').includes('seuemail') || (user || '').includes('seu_usuario')
  const hasPlaceholderPass = (pass || '').includes('senha') || (pass || '').includes('digitos')

  if (!host || !user || !pass) {
    console.log('Configuração SMTP incompleta no .env.')
    console.log('Preencha: SMTP_HOST, SMTP_USER e SMTP_PASS para testar envio real.')
    process.exit(0)
  }

  if (hasPlaceholderUser || hasPlaceholderPass) {
    console.log('Seu .env ainda contém valores de exemplo para SMTP_USER/SMTP_PASS.')
    console.log('Substitua por e-mail real e senha de app, depois rode novamente: npm run test-email')
    process.exit(0)
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass }
  })

  try {
    await transporter.verify()

    const result = await transporter.sendMail({
      from,
      to,
      subject: 'Teste SMTP - HORB',
      text: 'Este é um e-mail de teste do projeto HORB para validar sua configuração SMTP.'
    })

    console.log('SMTP validado com sucesso.')
    console.log(`E-mail de teste enviado para: ${to}`)
    console.log(`Message ID: ${result.messageId}`)
    process.exit(0)
  } catch (error) {
    console.error('Falha ao validar/enviar e-mail via SMTP.')
    console.error(error.message)
    process.exit(1)
  }
}

run()
