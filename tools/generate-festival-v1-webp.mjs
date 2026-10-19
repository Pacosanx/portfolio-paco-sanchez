import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root=process.cwd();
const dir=path.join(root,'assets/presentation/festival-v1');
const target=fs.statSync(path.join(root,'assets/presentation/festival-v2/apertura.webp')).size;
const profiles=[{fps:16,width:1280,quality:70},{fps:12,width:1120,quality:65},{fps:12,width:960,quality:60},{fps:10,width:800,quality:52},{fps:8,width:720,quality:46},{fps:6,width:640,quality:40},{fps:5,width:480,quality:34}];
const items=[{input:'3d-tentaculos.mp4',output:'3d-tentaculos.webp',crop:true},{input:'video-3d-mutar.mp4',output:'video-3d-mutar.webp',logo:true},{input:'3d-complejo.mp4',output:'3d-complejo.webp',crop:true}];
function run(args){const result=spawnSync('ffmpeg',args,{encoding:'utf8'});if(result.status!==0)throw new Error(result.stderr||'FFmpeg terminó con error.');}
for(const item of items){
 const input=path.join(dir,item.input),output=path.join(dir,item.output);
 if(!fs.existsSync(input))throw new Error('No existe el video fuente: '+input);
 let completed=false;
 for(const profile of profiles){
  const filters=[];
  if(item.crop)filters.push('crop=iw-24:ih-24:12:12');
  filters.push('fps='+profile.fps);
  filters.push("scale=w='min("+profile.width+",iw)':h=-2:flags=lanczos");
  const args=['-hide_banner','-loglevel','error','-y','-i',input];
  const vf=filters.join(',');
  if(item.logo){
   const logo=path.join(dir,'marca-v1.png');
   if(!fs.existsSync(logo))throw new Error('No existe la marca MUTAR V1: '+logo);
   args.push('-i',logo);
   args.push('-filter_complex','[0:v]'+vf+'[base];[1:v]scale='+Math.round(profile.width*.42)+':-2[mark];[base][mark]overlay=(W-w)/2:(H-h)/2:format=auto[outv]');
   args.push('-map','[outv]');
  }else args.push('-vf',vf);
  args.push('-an','-c:v','libwebp','-lossless','0','-quality',String(profile.quality),'-compression_level','6','-loop','0','-f','webp',output);
  run(args);
  const size=fs.statSync(output).size;
  console.log(item.output+': '+size+' bytes ('+profile.fps+' fps, '+profile.width+'px, q'+profile.quality+')');
  if(size<=target){completed=true;break;}
 }
 if(!completed)throw new Error(item.output+' supera el tamaño de festival-v2/apertura.webp incluso con el perfil mínimo.');
}
const posterInput=path.join(dir,'video-piezas.mp4');
const posterOutput=path.join(dir,'video-poster.jpg');
run(['-hide_banner','-loglevel','error','-y','-ss','14','-i',posterInput,'-frames:v','1','-q:v','2',posterOutput]);
console.log('video-poster.jpg: frame de presentación extraído en 00:14.');
