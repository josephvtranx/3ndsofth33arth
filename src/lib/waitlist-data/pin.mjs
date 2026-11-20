import { randomBytes,scrypt as scryptCallback,timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
const scrypt=promisify(scryptCallback);
export async function hashPin(pin){
 if(!/^\d{4,12}$/.test(pin))throw new Error('Use an 4–12 digit PIN.');
 const salt=randomBytes(16).toString('hex');
 return 'scrypt:'+salt+':'+Buffer.from(await scrypt(pin,salt,64)).toString('hex');
}
export async function checkPin(pin,stored){
 if(typeof pin!=='string'||!/^\d{4,12}$/.test(pin)||typeof stored!=='string'||!/^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/.test(stored))return false;
 const [,salt,expected]=stored.split(':');const actual=Buffer.from(await scrypt(pin,salt,64));
 return timingSafeEqual(actual,Buffer.from(expected,'hex'));
}
