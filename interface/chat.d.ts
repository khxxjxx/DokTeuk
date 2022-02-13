type queryType = string | string[] | undefined;

interface Person {
  id: string;
  nickname: string;
  job: string;
}

interface ChatRoom {
  id?: string;
  users?: Person[];
  userIds?: string[];
  other?: person;
  lastChat: string | undefined;
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

interface ImgProps {
  src: string;
  alt: string;
}

interface NoticeProps {
  isRead: boolean;
}

interface FileType {
  type: string;
  file: (Blob | ArrayBuffer)[];
  src: (string | ArrayBuffer | null)[];
}

interface UserType {
  id: string;
  nickname: string;
  job: string;
}
