import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeStorageUrls, stableStorageUrl } from '../shared/storageUrls';
test('legacy public file URLs survive gateway changes without modifying unrelated URLs',()=>{
 const file='12345678-1234-1234-1234-123456789abc.png';
 assert.equal(stableStorageUrl(`https://expired.trycloudflare.com/files-api/storage/academia/${file}`),`/api/storage/public/${file}`);
 const date=new Date();
 const source={cover:`https://old.example/storage/academia/${file}`, nested:[{date,url:'https://example.com/image.png'}]};
 const result=normalizeStorageUrls(source);
 assert.equal(result.cover,`/api/storage/public/${file}`);
 assert.equal(result.nested[0].date,date);
 assert.equal(result.nested[0].url,source.nested[0].url);
 assert.equal(stableStorageUrl('https://old.example/files-api/content/private?ticket=secret'),'https://old.example/files-api/content/private?ticket=secret');
});
