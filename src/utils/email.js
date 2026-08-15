function configured(value) {
  return String(value || '').trim()
}

export async function sendEmailWithAttachment({ toEmail, toName, subject, message, attachments = [], attachment }) {
  const serviceId = configured(import.meta.env.VITE_EMAILJS_SERVICE_ID)
  const templateId = configured(import.meta.env.VITE_EMAILJS_TEMPLATE_ID)
  const publicKey = configured(import.meta.env.VITE_EMAILJS_PUBLIC_KEY)

  if (!serviceId || !templateId || !publicKey) {
    return { ok: false, message: 'Email service is not configured. Add the EmailJS values to .env.local.' }
  }

  const files = Array.isArray(attachments) && attachments.length ? attachments.slice(0, 5) : attachment ? [attachment] : []
  const firstAttachment = files[0]
  const templateParams = {
    to_email: toEmail,
    to_name: toName,
    subject,
    message,
    attachment_1_name: firstAttachment?.name || '',
    attachment_1_data: firstAttachment?.data || ''
  }

  files.slice(1).forEach((file, index) => {
    const number = index + 2
    templateParams[`attachment_${number}_name`] = file.name
    templateParams[`attachment_${number}_data`] = file.data
  })

  const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: serviceId,
      template_id: templateId,
      user_id: publicKey,
      template_params: templateParams
    })
  })

  if (!response.ok) {
    const detail = await response.text()
    return { ok: false, message: detail || 'The email service rejected the request.' }
  }
  return { ok: true, message: 'Email sent successfully.' }
}
