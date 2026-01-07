
# 🩺 La Clínica del Ecommerce - Portal de Clientes

Este portal es una Single Page Application (SPA) de alto rendimiento diseñada para agencias de marketing.

## 🚀 Guía de Despliegue en Producción (Dominio Propio)

Para que tus clientes accedan mediante `tu-dominio.com`, sigue estos pasos:

### 1. Alojar el código (Hosting)
Recomendamos **Vercel** o **Netlify** por su facilidad para aplicaciones React/TypeScript.
1. Crea un repositorio en **GitHub** (puedes ponerlo como Privado).
2. Sube todos los archivos de este proyecto al repositorio.
3. Entra en [Vercel.com](https://vercel.com), crea un nuevo proyecto e importa tu repositorio de GitHub.
4. Vercel detectará automáticamente la configuración y te dará una URL temporal (ej. `clinica-app.vercel.app`).

### 2. Conectar tu Dominio
Una vez que el sitio esté "Live" en la URL temporal:
1. En Vercel, ve a **Settings > Domains**.
2. Escribe tu dominio o subdominio deseado (ej. `portal.tuagencia.com`).
3. Vercel te dará dos valores DNS:
   - **Si es un dominio principal (`tuagencia.com`):** Un registro **A** apuntando a una IP.
   - **Si es un subdominio (`portal.tuagencia.com`):** Un registro **CNAME** apuntando a `cname.vercel-dns.com`.

### 3. Configuración en tu Registrador (GoDaddy, Namecheap, DonWeb, etc.)
1. Entra al panel de control de tu dominio.
2. Busca la sección de **Gestión de DNS** o **Zona DNS**.
3. Agrega el registro que te dio Vercel en el paso anterior.
4. Espera de 5 a 30 minutos para la propagación. Vercel instalará el certificado **SSL (HTTPS)** automáticamente.

---

## 🛡️ Gestión de Datos y Seguridad

### ¿Dónde se guardan los datos?
Al ser una aplicación "Serverless" para facilitar la privacidad, los datos se guardan en el **LocalStorage** del navegador del administrador. 

### ¿Cómo no perder nada?
1. **Backups:** En el panel Admin, usa la **Caja Fuerte de Datos** para descargar un archivo `.json`.
2. **Cambio de PC:** Si vas a administrar desde otra computadora, simplemente importa ese archivo `.json` en la nueva máquina.
3. **Multi-Admin:** Si necesitas que varias personas editen, la forma más robusta es que una persona centralice las ediciones y comparta el archivo de backup actualizado.

---

## 📊 Configuración de Looker Studio
Para que los reportes carguen correctamente:
1. En Looker Studio, ve a **Compartir > Embeber reporte**.
2. Asegúrate de que **"Habilitar embebido"** esté marcado.
3. Copia la URL del `src` y pégala en el panel de Clientes del administrador.
