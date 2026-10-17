# Imagem base: servidor web Nginx enxuto
FROM nginx:alpine

# Copia os arquivos da aplicacao para a pasta servida pelo Nginx
COPY index.html style.css script.js /usr/share/nginx/html/

# Porta padrao do Nginx
EXPOSE 80
