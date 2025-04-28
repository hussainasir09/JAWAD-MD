FROM quay.io/gurusensei/gurubhay:latest

RUN git clone https://github.com/JawadTechXD/JAWAD-MD/root/ikjawad

WORKDIR /root/ikjawad/

RUN npm install --platform=linuxmusl

EXPOSE 5000

CMD ["npm", "start"]
