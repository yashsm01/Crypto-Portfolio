FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173      
EXPOSE 9229        

CMD ["npm", "run", "dev", "--", "--host"] 
# CMD ["npm", "run", "dev:debug"]