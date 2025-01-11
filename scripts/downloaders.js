import { pocketbase } from "./utility.js";
import * as fs from 'fs';
import * as stream from 'stream';
import { promisify } from 'util';
import axios from "axios";
import { File } from "buffer";
import path from "path";

export const mimes = {
    'audio/aac': 'aac',
    'application/x-abiword': 'abw',
    'application/x-freearc': 'arc',
    'image/avif': 'avif',
    'video/x-msvideo': 'avi',
    'application/vnd.amazon.ebook': 'azw',
    'application/octet-stream': 'bin',
    'image/bmp': 'bmp',
    'application/x-bzip': 'bz',
    'application/x-bzip2': 'bz2',
    'application/x-cdf': 'cda',
    'application/x-csh': 'csh',
    'text/css': 'css',
    'text/csv': 'csv',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-fontobject': 'eot',
    'application/epub+zip': 'epub',
    'application/gzip': 'gz',
    'image/gif': 'gif',
    'text/html': 'html',
    'text/calendar': 'ics',
    'application/java-archive': 'jar',
    'image/jpeg': 'jpeg',
    'text/javascript': 'js',
    'application/json': 'json',
    'application/ld+json': 'jsonld',
    'audio/midi': 'midi',
    'audio/x-midi': 'midi',
    // 'text/javascript': 'mjs',
    'audio/mpeg': 'mp3',
    'video/mp4': 'mp4',
    'video/mpeg': 'mpeg',
    'application/vnd.apple.installer+xml': 'mpkg',
    'application/vnd.oasis.opendocument.presentation': 'odp',
    'application/vnd.oasis.opendocument.spreadsheet': 'ods',
    'application/vnd.oasis.opendocument.text': 'odt',
    'audio/ogg': 'oga',
    'video/ogg': 'ogv',
    'application/ogg': 'ogx',
    'audio/opus': 'opus',
    'font/otf': 'otf',
    'image/png': 'png',
    'application/pdf': 'pdf',
    'application/x-httpd-php': 'php',
    'application/vnd.ms-powerpoint': 'ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    'application/vnd.rar': 'rar',
    'application/rtf': 'rtf',
    'application/x-sh': 'sh',
    'image/svg+xml': 'svg',
    'application/x-tar': 'tar',
    'image/tiff': 'tiff',
    'video/mp2t': 'ts',
    'font/ttf': 'ttf',
    'text/plain': 'txt',
    'application/vnd.visio': 'vsd',
    'audio/wav': 'wav',
    'audio/webm': 'weba',
    'video/webm': 'webm',
    'image/webp': 'webp',
    'font/woff': 'woff',
    'font/woff2': 'woff2',
    'application/xhtml+xml': 'xhtml',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/xml': 'xml',
    'text/xml': 'xml',
    'application/atom+xml': 'xml',
    'application/vnd.mozilla.xul+xml': 'xul',
    'application/zip': 'zip',
    'video/3gpp': '3gp',
    'audio/3gpp': '3gp',
    'video/3gpp2': '3g2',
    'audio/3gpp2': '3g2',
    'application/x-7z-compressed': '7z'
};

export const downloadFile = async (name, url, ext = null) => {
    const finishedDownload = promisify(stream.finished);

    const extensions = ['.png', '.jpg', '.jpeg', '.mp4', '.webp']
    let extension = null
    extensions.forEach((e) => (extension === null && url.includes(e)) ? extension = e : null)

    if (extension === null) {
        const response = await fetch(url);
        const contentType = response.headers.get('content-type')?.split(';')[0]?.trim() ?? null
        if (contentType) extension = mimes[contentType] ? '.' + mimes[contentType] : null
    }


    const filename = `${name}${ext ?? extension}`
    const filePath = `./temp/files/${filename}`
    const writer = fs.createWriteStream(filePath)
    try {
        const response = await axios.get(url, {
            responseType: "stream",
        });

        response.data.pipe(writer)
        await finishedDownload(writer);

        return filePath
    } catch (error) {
        return null
    }
}

export const download = async () => {
    const pb = await pocketbase()
    const filter = "type = 'web' && files:length = 0"

    const a = await pb.collection('avogado').getList(1, 200, { filter });
    for (let i = a.totalPages; i >= 1; i--) {
        const payload = await pb.collection('avogado').getList(i, 200, { filter });
        if (i === 1) {
            console.info(`downloading ${payload.totalItems} items`)
        }
        for (let j = 0; j < payload.items.length; j++) {
            const item = payload.items[j];
            // this is for web
            const urls = [item.data?.url] ?? []

            let fileIds = []
            for (let k = 0; k < urls.length; k++) {
                const url = urls[k];
                const splitUrl = url.split('/')
                const fileName = splitUrl[splitUrl.length - 1]
                const downloadPath = await downloadFile(fileName, url)

                const fileBuffer = fs.readFileSync(downloadPath)
                const newFile = new File([Buffer.from(fileBuffer)], fileName)
                console.log(newFile.size, fileName)
                try {
                    const createFile = await pb.collection('avogado_files').create({
                        avogado_id: item.id,
                        file: newFile,
                    });
                    fileIds.push(createFile.id)
                } catch (error) {
                    console.error(`Error Upload: ${item.id}`)
                }
            }

            await pb.collection('avogado').update(item.id, {
                ...item,
                files: fileIds
            })
        }
    }

    removeAllFile('./temp/files/')
}

const removeAllFile = (folderPath) => {
    fs.readdir(folderPath, (err, files) => {
        if (err) {
            return console.error(`Unable to read folder: ${err.message}`);
        }
    
        files.forEach((file) => {
            const filePath = path.join(folderPath, file);
    
            // Skip .gitignore file
            if (file === '.gitignore') {
                return;
            }
    
            // Check if the item is a file
            fs.stat(filePath, (err, stats) => {
                if (err) {
                    return console.error(`Unable to get stats for file: ${filePath}, ${err.message}`);
                }
    
                if (stats.isFile()) {
                    // Delete the file
                    fs.unlink(filePath, (err) => {
                        if (err) {
                            return console.error(`Unable to delete file: ${filePath}, ${err.message}`);
                        }
                        console.log(`Deleted: ${filePath}`);
                    });
                }
            });
        });
    });
}

export default download;