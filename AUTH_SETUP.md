# Configurar acceso con Google

La pagina ya tiene una compuerta de acceso con Google Identity Services.

Para activarla:

1. Entra a Google Cloud Console.
2. Crea o selecciona un proyecto.
3. Configura la pantalla de consentimiento OAuth.
4. Crea una credencial de tipo "OAuth client ID" para "Web application".
5. Agrega este origen autorizado:
   `https://lisaprz0803.github.io`
6. Edita `public/auth-config.js`:
   - `googleClientId`: pega el Client ID de Google.
   - `allowedEmails`: deja solo el correo Google que puede entrar.

Ejemplo:

```js
window.AGENDA_AUTH_CONFIG = {
  googleClientId: "1234567890-abcxyz.apps.googleusercontent.com",
  allowedEmails: ["nombre@gmail.com"]
};
```

Nota: esta proteccion es una compuerta cliente para GitHub Pages. Para seguridad real con bloqueo antes de servir archivos, usa un dominio propio con Cloudflare Access o un hosting con autenticacion del lado servidor.
