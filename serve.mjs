import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve('dist');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.gif':'image/gif','.woff2':'font/woff2'};
http.createServer((req,res)=>{
  let requested;
  try{requested=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{res.writeHead(400);res.end();return}
  let file=path.resolve(root,'.'+requested);
  if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403);res.end();return}
  try{if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');const body=fs.readFileSync(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(body)}catch{res.writeHead(404);res.end('No encontrado')}
}).listen(4173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4173'));
