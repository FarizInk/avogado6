import { cliLoading, delay, getDataIG, pocketbase } from "./utility.js";
import * as fs from 'fs';
import * as stream from 'stream';
import { promisify } from 'util';
import axios from "axios";
import { File } from "buffer";
import path from "path";

export const downloadFile = async (name, url, ext = null) => {
    const finishedDownload = promisify(stream.finished);

    const extensions = ['.png', '.jpg', '.jpeg', '.mp4', '.webp']
    let extension = null
    extensions.forEach((e) => (extension === null && url.includes(e)) ? extension = e : null)

    if (extension === null) {
        const response = await fetch(url);
        const contentType = response.headers.get('content-type')?.split(';')[0]?.trim() ?? null
        if (contentType) extension = mimes[contentType] ? `.${mimes[contentType]}` : null
    }


    const filename = name.includes('.') ? name : `${name}${ext ?? extension}`
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

export const download = async (type) => {
    if (type === null) return;
    const pb = await pocketbase()
    const filter = `type = '${type}' && files:length = 0`

    const a = await pb.collection('avogado').getList(1, 200, { filter });
    const bar = cliLoading(`Downloading ${type}`)
    bar.start(a.totalItems, 0)

    let countDownload = 1
    for (let i = a.totalPages; i >= 1; i--) {
        const payload = await pb.collection('avogado').getList(i, 200, { filter });
        for (let j = 0; j < payload.items.length; j++) {
            const item = payload.items[j];
            if (item.metadata?.download_failed) {
                const responseData = await getDataIG(item.data.url)
                if (responseData?.items && responseData?.items.length) {
                    const responseItem = responseData?.items[0] ?? null
                    item.data = {
                        ...responseItem,
                        ...item.data,
                    }
                    delete item.metadata.download_failed
                }
                await delay(2)
            }

            let urls = []
            if (type === 'web') {
                if (item.data?.url) urls.push(item.data.url)
            } else if (type === 'twitter') {
                item.data?.mediaURLs?.forEach((url) => urls.push(url))
            } else if (type === 'instagram') {
                if (item.data.url.toString().includes('/reel')) {
                    const video = item.data?.video_versions ? item.data?.video_versions[0] : null
                    if (video && video.url) urls.push(video.url)
                } else {
                    const medias = item.data?.carousel_media ?? [item.data]
                    for (let i = 0; i < medias.length; i++) {
                        const media = medias[i];
                        let url = null
                        if (media.video_versions?.length >= 1) {
                            url = media.video_versions[0]?.url
                        } else {
                            url = media.image_versions2?.candidates[0]?.url ?? null
                        }
                        if (url) urls.push(url)
                    }
                }
            }

            let fileIds = []
            for (let k = 0; k < urls.length; k++) {
                const url = urls[k];
                let urlObj = new URL(url);
                urlObj.search = "";
                const splitUrl = urlObj.toString().split('/')
                const fileName = splitUrl[splitUrl.length - 1]
                const downloadPath = await downloadFile(fileName, url)

                const fileBuffer = fs.readFileSync(downloadPath)
                const newFile = new File([Buffer.from(fileBuffer)], fileName, {
                    type: getMimeTypeFromFileName(fileName)
                })
                // console.info(`${fileName} (${bytesToMB(newFile.size)}MB)`)
                try {
                    const createFile = await pb.collection('avogado_files').create({
                        avogado_id: item.id,
                        file: newFile,
                        data: {
                            size: newFile.size,
                            type: newFile.type,
                            name: newFile.name
                        },
                    });
                    fileIds.push(createFile.id)
                } catch (error) {
                    console.error(`Error Upload: ${item.id}`)
                }
            }

            if (fileIds.length) {
                await pb.collection('avogado').update(item.id, {
                    ...item,
                    files: fileIds
                })
            }
            bar.update(countDownload)
            countDownload++
        }
    }
    bar.stop()

    console.info()
    removeAllFile('./temp/files/')
}

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

export const getMimeTypeFromFileName = (fileName) => {
    if (!fileName || typeof fileName !== "string") {
        throw new Error("Invalid file name");
    }

    const mimeTypes = {
        "txt": "text/plain",
        "html": "text/html",
        "css": "text/css",
        "js": "application/javascript",
        "json": "application/json",
        "xml": "application/xml",
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "png": "image/png",
        "gif": "image/gif",
        "svg": "image/svg+xml",
        "pdf": "application/pdf",
        "doc": "application/msword",
        "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "xls": "application/vnd.ms-excel",
        "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "ppt": "application/vnd.ms-powerpoint",
        "pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "zip": "application/zip",
        "rar": "application/vnd.rar",
        "mp3": "audio/mpeg",
        "mp4": "video/mp4",
        "wav": "audio/wav",
        "avi": "video/x-msvideo",
        "webm": "video/webm",
    };

    const extension = fileName.split('.').pop().toLowerCase();

    return mimeTypes[extension] || "application/octet-stream"; // Default to binary data
};

export const bytesToMB = (bytes) => {
    if (typeof bytes !== "number" || bytes < 0) {
        throw new Error("Invalid input: bytes must be a non-negative number");
    }
    const MB = bytes / (1024 * 1024);
    return parseFloat(MB.toFixed(2)); // Returns the result rounded to 2 decimal places
};

const removeAllFile = (folderPath) => {
    fs.readdir(folderPath, (err, files) => {
        if (err) {
            return console.error(`Unable to read folder: ${err.message}`);
        }

        const bar = cliLoading(`Removing Cache`)
        bar.start(files.length - 1, 0)
        let countDelete = 1;
        files.forEach((file, key) => {
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
                    });

                    bar.update(countDelete)
                    countDelete++
                }
            });
        });
        bar.stop()
    });
}

export default download;