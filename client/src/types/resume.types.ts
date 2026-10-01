// Resume entity returned from the API
export interface Resume {
  _id: string;
  userId: string;
  fileName: string;
  originalName: string;
  fileSize: number;           // bytes
  fileType: 'pdf' | 'docx';
  extractedText: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResumeUploadResponse {
  resume: Resume;
}

export interface ResumeListResponse {
  resumes: Resume[];
}

export interface ResumeSingleResponse {
  resume: Resume;
}
