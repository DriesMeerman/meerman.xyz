export function getImage(name, ext, size){
    ext = ext ? ext : 'png';
    size = size ? size : 400;
    return `/g/assets/${name}-${size}.${ext}`

}