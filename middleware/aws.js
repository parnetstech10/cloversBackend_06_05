// import {
//     S3Client,
//     PutObjectCommand,
//     DeleteObjectCommand,
//     ListObjectsV2Command,
//     GetObjectCommand,
//   } from "@aws-sdk/client-s3";
//   import  dotenv  from "dotenv" ;
//   import fs  from "fs";
//   import path from "path";
//   import  { pipeline }  from "stream";
//   import { promisify } from "util";
//   dotenv.config();
  
//   const s3Client = new S3Client({
//     region: process.env.AWS_REGION,
//     credentials: {
//       accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//       secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//     },
  
//   });
  
  
//   const DOWNLOAD_DIR = path.join(__dirname, "downloads");
//   const streamPipeline = promisify(pipeline);
//   // if (!fs.existsSync(DOWNLOAD_DIR)) {  
//   //   fs.mkdirSync(DOWNLOAD_DIR);
//   // }
  
//   const downloadAllImages = async (bucketName = process.env.AWS_S3_BUCKET_NAME) => {
//     try {
//       const listParams = {
//         Bucket: bucketName,
//       };
  
//       const listCommand = new ListObjectsV2Command(listParams);
//       const listData = await s3Client.send(listCommand);
  
//       if (!listData.Contents || listData.Contents.length === 0) {
//         console.log("No files found in bucket.");
//         return;
//       }
  
//       const imageFiles = listData.Contents.filter((file) =>
//         /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(file.Key)
//       );
  
//       console.log(`Found ${imageFiles.length} image(s). Downloading...`);
  
//       for (const file of imageFiles) {
//         const localPath = path.join(DOWNLOAD_DIR, file.Key);
//         const localDir = path.dirname(localPath);
  
//         // Create folder structure if not exists
//         fs.mkdirSync(localDir, { recursive: true });
  
//         const getObjectParams = {
//           Bucket: bucketName,
//           Key: file.Key,
//         };
  
//         const getObjectCommand = new GetObjectCommand(getObjectParams);
//         const data = await s3Client.send(getObjectCommand);
  
//         await streamPipeline(data.Body, fs.createWriteStream(localPath));
//         console.log(`Downloaded: ${file.Key}`);
//       }
  
//       console.log("✅ All images downloaded successfully.");
//     } catch (err) {
//       console.error("❌ Error downloading images:", err);
//     }
//   };
  
  
//   const uploadFile = (file, bucketname) => {
//     return new Promise((resolve, reject) => {
//       // const file = files.image[0];
//       // console.log(file,bucketname);
//       const params = {
//         Bucket: process.env.AWS_S3_BUCKET_NAME,
//         Key: `${bucketname}/${Date.now() + "_" + file.originalFilename}`,
//         Body: fs.createReadStream(file.filepath),
//         ContentType: file.mimetype,
//       };
//       const command = new PutObjectCommand(params);
//       s3Client.send(command, (err, data) => {
//         if (err) {
//           reject("File not uploaded");
//         } else {
//           // console.log(data);
//           let location = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.amazonaws.com/${params.Key}`;
//           console.log(location);
//           resolve(location);
//         }
//       });
//     });
//   };
  
//   const uploadFile2 = (file, bucketname) => {
//     return new Promise((resolve, reject) => {
//       // const file = files.image[0];
//       // console.log(file,bucketname);
//       const params = {
//         Bucket: process.env.AWS_S3_BUCKET_NAME,
//         Key: `${bucketname}/${Date.now() + "_" + file.originalname}`,
//         Body: file.buffer,
//         ContentType: file.mimetype,
//       };
//       const command = new PutObjectCommand(params);
//       s3Client.send(command, (err, data) => {
//         if (err) {
//           reject("File not uploaded");
//         } else {
//           // console.log(data);
//           let location = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.amazonaws.com/${params.Key}`;
//           console.log(location);
//           resolve(location);
//         }
//       });
//     });
//   };
  
  
//   const getUrlFileKey = (url) => {
//     const regex = /^https?:\/\/([^\.]+)\.s3.amazonaws.com\/(.+)$/;
//     const match = url.match(regex);
//     if (match) {
//       return match[2]; // file key is in group 2
//     } else {
//       throw new Error(`Invalid S3 URL: ${url}`);
//     }
//   };
  
//   const deleteFile = async (url) => {
    
//    const fileKey= getUrlFileKey(url)
//    console.log(fileKey);
//     const params = {
//       Bucket: process.env.AWS_S3_BUCKET_NAME,
//       Delete: {
//         Objects: [{ Key: fileKey }],
//       },
//     };
  
//     try {
//       const data = await s3Client.destroy(params);
//       return data;
//     } catch (err) {
//       throw new Error(`Error deleting file: ${err.message}`);
//     }
//   };
  
//   const updateFile = async (fileKey, newFile) => {
//     await deleteFile(fileKey); // Delete the old file first
  
//     const params = {
//       ACL: "public-read",
//       Bucket: process.env.AWS_S3_BUCKET_NAME,
//       Key: fileKey,
//       Body: newFile.buffer,
//     };
  
//     try {
//       const command = new PutObjectCommand(params);
//       const data = await s3Client.send(command);
//       return data.Location;
//     } catch (err) {
//       throw new Error(`Error updating file: ${err.message}`);
//     }
//   };
  
//   const multifileUpload = async (files, bucketname) => {
//     return Promise.all(
//       files.map((file) => {
//         const params = {
//           Bucket: process.env.AWS_S3_BUCKET_NAME,
//           Key: `${bucketname}/${Date.now()}_${file.originalname}`,
//           Body: file.buffer,
//         };
  
//         return new Promise((resolve, reject) => {
//           s3Client.send(new PutObjectCommand(params), (err, data) => {
//             if (err) {
//               reject(err);
//             } else {
//               let location = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.amazonaws.com/${params.Key}`;
//               console.log(location);
//               resolve(location);
//             }
//           });
//         });
//       })
//     );
//   };
  
//   module.exports= { uploadFile,uploadFile2, deleteFile, updateFile, multifileUpload,downloadAllImages }; 
 
 
import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
    ListObjectsV2Command,
    GetObjectCommand
  } from "@aws-sdk/client-s3";
  import dotenv from "dotenv";
  import fs from "fs";
  import path from "path";
  import { pipeline } from "stream";
  import { promisify } from "util";
  
  dotenv.config();
  
  const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
  
//   const DOWNLOAD_DIR = path.join(__dirname, "downloads");
//   const streamPipeline = promisify(pipeline);
  
//   export const downloadAllImages = async (bucketName = process.env.AWS_S3_BUCKET_NAME) => {
//     try {
//       const listCommand = new ListObjectsV2Command({ Bucket: bucketName });
//       const listData = await s3Client.send(listCommand);
  
//       if (!listData.Contents || listData.Contents.length === 0) {
//         console.log("No files found in bucket.");
//         return;
//       }
  
//       const imageFiles = listData.Contents.filter((file) =>
//         /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(file.Key)
//       );
  
//       console.log(`Found ${imageFiles.length} image(s). Downloading...`);
  
//       for (const file of imageFiles) {
//         const localPath = path.join(DOWNLOAD_DIR, file.Key);
//         fs.mkdirSync(path.dirname(localPath), { recursive: true });
  
//         const getObjectCommand = new GetObjectCommand({ Bucket: bucketName, Key: file.Key });
//         const data = await s3Client.send(getObjectCommand);
  
//         await streamPipeline(data.Body, fs.createWriteStream(localPath));
//         console.log(`Downloaded: ${file.Key}`);
//       }
  
//       console.log("✅ All images downloaded successfully.");
//     } catch (err) {
//       console.error("❌ Error downloading images:", err);
//     }
//   };
  
  export const uploadFile = (file, bucketname) => {
    return new Promise((resolve, reject) => {
      const params = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: `${bucketname}/${Date.now()}_${file.originalFilename}`,
        Body: fs.createReadStream(file.filepath),
        ContentType: file.mimetype,
      };
  
      const command = new PutObjectCommand(params);
      s3Client.send(command, (err, data) => {
        if (err) {
          reject("File not uploaded");
        } else {
          const location = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.amazonaws.com/${params.Key}`;
          console.log(location);
          resolve(location);
        }
      });
    });
  };
  
  export const uploadFile2 = (file, bucketname) => {
    return new Promise((resolve, reject) => {
      const params = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: `${bucketname}/${Date.now()}_${file.originalname}`,
        Body: file.buffer,
        ContentType: file.mimetype,
      };
  
      const command = new PutObjectCommand(params);
      s3Client.send(command, (err, data) => {
        if (err) {
          reject("File not uploaded");
        } else {
          const location = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.amazonaws.com/${params.Key}`;
          console.log(location);
          resolve(location);
        }
      });
    });
  };
  
  export const getUrlFileKey = (url) => {
    const regex = /^https?:\/\/([^\.]+)\.s3\.amazonaws\.com\/(.+)$/;
    const match = url.match(regex);
    if (match) {
      return match[2];
    } else {
      throw new Error(`Invalid S3 URL: ${url}`);
    }
  };
  
  export const deleteFile = async (url) => {
    const fileKey = getUrlFileKey(url);
    console.log(fileKey);
  
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: fileKey,
    };
  
    try {
      const command = new DeleteObjectCommand(params);
      const data = await s3Client.send(command);
      return data;
    } catch (err) {
      throw new Error(`Error deleting file: ${err.message}`);
    }
  };
  
  export const updateFile = async (fileKey, newFile) => {
    await deleteFile(`https://${process.env.AWS_S3_BUCKET_NAME}.s3.amazonaws.com/${fileKey}`);
  
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: fileKey,
      Body: newFile.buffer,
      ACL: "public-read",
    };
  
    try {
      const command = new PutObjectCommand(params);
      const data = await s3Client.send(command);
      return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.amazonaws.com/${params.Key}`;
    } catch (err) {
      throw new Error(`Error updating file: ${err.message}`);
    }
  };
  
  export const multifileUpload = async (files, bucketname) => {
    return Promise.all(
      files.map((file) => {
        const params = {
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: `${bucketname}/${Date.now()}_${file.originalname}`,
          Body: file.buffer,
        };
  
        return new Promise((resolve, reject) => {
          s3Client.send(new PutObjectCommand(params), (err, data) => {
            if (err) {
              reject(err);
            } else {
              const location = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.amazonaws.com/${params.Key}`;
              console.log(location);
              resolve(location);
            }
          });
        });
      })
    );
  };
  