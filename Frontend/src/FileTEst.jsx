import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { useState } from "react";

const UPLOAD_FILE = gql`
  mutation UploadFile($file: Upload!) {
    uploadFile(file: $file) {
      ok
      fileUrl
    }
  }
`;

export default function FileUploader() {
  const [uploadFile] = useMutation(UPLOAD_FILE);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    try {
      const { data } = await uploadFile({
        variables: { file: selectedFile },
      });
      console.log("Uploaded:", data.uploadFile.fileUrl);
    } catch (err) {
      console.error("Upload error:", err);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>
    </div>
  );
}
