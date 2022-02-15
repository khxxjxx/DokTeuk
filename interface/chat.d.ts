type queryType = string | string[] | undefined;

interface Person {
  id: string;
  nickname: string;
  jobSector: string;
}

interface ChatRoom {
  id?: string;
  users?: Person[];
  userIds?: string[];
  other?: person;
  lastChat: string;
  updateAt: Timestamp;
  lastVisited: {
    [k: string]: Timestamp;
  };
}

interface ChatText {
  id?: string;
  from: string;
  msg?: string;
  img?: string;
  createAt: Timestamp;
}

interface FileType {
  type: string;
  file: (Blob | ArrayBuffer)[];
  src: (string | ArrayBuffer | null)[];
}

interface ImgType {
  file: Blob | ArrayBuffer;
  src: string | ArrayBuffer | null;
}
