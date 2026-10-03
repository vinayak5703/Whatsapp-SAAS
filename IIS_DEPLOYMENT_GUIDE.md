# 🏢 Windows Server IIS वर MsgFlow SaaS Deploy करण्याची सोपी पद्धत (IIS Deployment Guide)

होय! तुम्ही **Windows Server IIS (Internet Information Services)** वर **MsgFlow SaaS** ची टेस्टिंग आणि प्रोडक्शन डिप्लॉयमेंट अतिशय सहज करू शकता.

---

## 📋 1. आवश्यक सॉफ्टवेअर (Prerequisites on Windows Server)

1. **IIS (Internet Information Services)** सुरू असणे आवश्यक आहे (Windows Features मधून *World Wide Web Services* सक्षम करा).
2. **[IIS URL Rewrite Module](https://www.iis.net/downloads/microsoft/url-rewrite)** (इन्स्टॉल करा - Angular SPA साठी आवश्यक).
3. **[IIS Application Request Routing (ARR)](https://www.iis.net/downloads/microsoft/application-request-routing)** (Backend Reverse Proxy साठी).
4. **Node.js (v20+ LTS)** Windows Installer द्वारे इन्स्टॉल करा.
5. **PostgreSQL 16** (किंवा Remote Cloud Database).

---

## 🚀 2. पायरी-दर-पायरी डिप्लॉयमेंट (Step-by-Step Setup)

### **पायरी १: Backend तयार करणे व चालू ठेवणे**
1. प्रोजेक्टच्या `backend` फोल्डरमध्ये जाऊन बिल्ड करा:
   ```powershell
   cd c:\Users\Admin\StudioProjects\whatsapp-saas-platform\backend
   npm install
   npm run build
   ```
2. बॅकएंड **Port 3001** वर कायम चालू ठेवण्यासाठी `PM2` (किंवा Windows Service) वापरा:
   ```powershell
   npm install -g pm2
   npm install -g pm2-windows-service
   
   # Start backend
   pm2 start dist/main.js --name "msgflow-backend"
   # Or directly: node dist/main.js
   pm2 save
   ```

---

### **पायरी २: Frontend Angular बिल्ड करणे**
1. प्रोजेक्टच्या `frontend` फोल्डरमध्ये बिल्ड कमांड चालवा:
   ```powershell
   cd c:\Users\Admin\StudioProjects\whatsapp-saas-platform\frontend
   npm run build
   ```
   > 💡 यामुळे `frontend/dist/whatsapp-saas-frontend/browser` फोल्डरमध्ये तयार सर्व फाइल्स आणि **`web.config`** आपोआप जनरेट होतात.

---

### **पायरी ३: IIS मध्ये नवीन Website तयार करणे**
1. **IIS Manager** उघडा (`inetmgr` Run करा).
2. **Sites** वर Right-Click करा -> **Add Website...** निवडा.
3. खालील तपशील भरा:
   - **Site name**: `MsgFlow` (किंवा तुमच्या पसंतीचे नाव).
   - **Physical path**: `C:\Users\Admin\StudioProjects\whatsapp-saas-platform\frontend\dist\whatsapp-saas-frontend\browser`
   - **Port**: `80` (किंवा `8080` टेस्टिंगसाठी).
4. **OK** वर क्लिक करा.

---

### **पायरी ४: Application Request Routing (ARR) Proxy सक्षम करणे**
1. IIS Manager मध्ये तुमच्या **Server Name** वर क्लिक करा.
2. **Application Request Routing Cache** आयकॉनवर डबल-क्लिक करा.
3. उजव्या बाजूला **Server Proxy Settings...** वर क्लिक करा.
4. **Enable proxy** चेकबॉक्स टिक (Check) करा आणि **Apply** वर क्लिक करा.

---

## 🎯 3. `web.config` मुळे मिळणारे फायदे:
प्रोजेक्टमध्ये आधीच तयार केलेले **`web.config`** खालील सर्व गोष्टी आपोआप सांभाळते:
- ✅ **Angular Routing**: युझरने कोणत्याही पेजवर (`/dashboard`, `/campaigns`, `/settings`, `/reports`) रिफ्रेश केले तरी `404 Error` येत नाही.
- ✅ **API Forwarding**: ब्राऊझरवरून येणाऱ्या `/api/*` सर्व कॉल्स थेट बॅकएंड **Port 3001** कडे फॉरवर्ड होतात.
- ✅ **Gzip Compression**: वेबसाइट फास्ट लोड होण्यासाठी कम्प्रेशन सुरू राहते.

---

## 🌐 4. टेस्टिंग URL:
IIS सुरू झाल्यानंतर तुम्ही ब्राऊझरमध्ये:
- **`http://localhost`** किंवा **`http://localhost:8080`** 
उघडून संपूर्ण ॲप टेस्ट करू शकता!
