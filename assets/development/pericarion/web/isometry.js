// One 2:1 ground projection shared by drawing, navigation, sound and notes.
export function iso(x,y,z=0){return{x:x-y,y:(x+y)*.5-z};}
export function uniso(x,y){return{x:y+x*.5,y:y-x*.5};}
export function screenPoint(x,y,z,view,width,height){const p=iso(x-view.x,y-view.y,z),s=view.base*view.zoom;return{x:width/2+p.x*s,y:height/2+p.y*s};}
export function worldPoint(x,y,view,width,height){const p=uniso((x-width/2)/(view.base*view.zoom),(y-height/2)/(view.base*view.zoom));return{x:view.x+p.x,y:view.y+p.y};}
// Height belongs to a body's existing reserve and phase, never to camera zoom.
export function plantHeight(radius,phase=0){return radius*1.8;}
export const ISO_GLSL=`vec3 isometric(vec3 p){return vec3(p.x-p.y,(p.x+p.y)*.5-p.z,0.0);}`;
