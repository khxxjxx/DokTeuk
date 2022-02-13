import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import Link from 'next/link';
import styled from '@emotion/styled';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { db, auth } from '@firebase/firebase';
import {
  doc,
  setDoc,
  getDocs,
  collection,
  query,
  where,
} from 'firebase/firestore';
import { getStorage, ref, uploadString } from 'firebase/storage';
import { useRouter } from 'next/router';
import MenuItem from '@mui/material/MenuItem';
import { UserInfo } from '@interface/StoreInterface';
import useId from '@mui/material/utils/useId';

const jobSectors = [
  { title: '외식·음료', url: 'food-service' },
  { title: '매장관리·판매', url: 'store' },
  { title: '서비스', url: 'service' },
  { title: '사무직', url: 'white-collar' },
  { title: '고객상담·리서치·영업', url: 'sales-research' },
  { title: '생산·건설·노무', url: 'blue-collar' },
  { title: 'IT·기술', url: 'it-tech' },
  { title: '디자인', url: 'design' },
  { title: '미디어', url: 'media' },
  { title: '운전·배달', url: 'drive' },
  { title: '병원·간호·연구', url: 'hospital' },
  { title: '교육·강사', url: 'education' },
];
type InputHelperText = {
  email: string;
  password: string;
  checkPassword: string;
  nickname: string;
  jobSector: string;
};

export default function Signup() {
  const router = useRouter();
  const dispatch = useDispatch();
  const storage = getStorage();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [checkPassword, setCheckPassword] = useState<string>('');
  const [nickname, setNickname] = useState<string>('');
  const [isGoogle, setIsGoogle] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [fileError, setFileError] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageExt, setImageExt] = useState<string>('');
  const [inputHelpers, setInputHelpers] = useState<InputHelperText>({
    email: '',
    password: '6자리 이상 입력 해 주세요',
    checkPassword: '비밀번호가 같지 않습니다.',
    nickname: '',
    jobSector: '직종을 선택 해 주세요',
  });
  const [jobSector, setJobSector] = useState('');

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let helperText;
    if (name === 'email') {
      setEmail(value);
    } else if (name === 'password') {
      if (value.length >= 6) {
        helperText = '사용 가능한 비밀번호 입니다!';
      }
      setPassword(value);
    } else if (name === 'checkPassword') {
      if (password !== value) {
        helperText = '비밀번호가 다릅니다!';
      } else {
        helperText = '비밀번호가 같습니다!';
      }
      setCheckPassword(value);
    } else if (name === 'nickname') setNickname(value);
    else if (name === 'jobSector') setJobSector(value);

    const newInputHelpers = {
      ...inputHelpers,
      [name]: helperText,
    };

    setInputHelpers(newInputHelpers);
  };

  const createUserWithEmail = async () => {
    try {
      const { user: result } = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      sendEmailVerification(result);
      return result.uid;
    } catch (err: any) {
      setError(err.code);
    }
  };

  const SignUpSubmitHandler = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const uid = (await createUserWithEmail()) as string;

    if (checkPassword !== password) {
      alert('비밀번호가 다릅니다!');
    } else {
      const userInitData: UserInfo = {
        nickname: nickname,
        jobSector: jobSector,
        validRounges: [
          {
            title: '타임라인',
            url: 'timeline',
          },
          {
            title: '토픽',
            url: 'topic',
          },
          {
            title: jobSector,
            url: jobSectors.find((v) => v.title === jobSector)?.url as string,
            // type error 잡아야 함
          },
        ],
        id: uid,
        hasNewNotification: true,
        posts: [],
        email: email,
      };

      uploadImg(uid);
      console.log('success');
      await setDoc(doc(db, 'user', uid), userInitData);
      await signOut(auth);
      router.push('/user/login');
    }
  };

  const uploadImg = async (uid: string) => {
    const imageName = `${uid}.${imageExt}`;
    const imgRef = ref(storage, imageName);
    try {
      await uploadString(imgRef, imageUrl, 'data_url');
    } catch (e: any) {
      console.error(e);
    }
  };

  const checkNickname = async () => {
    const nicknameCheckQuery = query(
      collection(db, 'user'),
      where('nickname', '==', nickname),
    );
    let nicknameHelperText;
    const nicknameCheckSnap = await getDocs(nicknameCheckQuery);
    if (nicknameCheckSnap.docs.length !== 0 || nickname.length < 3) {
      nicknameHelperText = '사용 불가능한 닉네임 입니다!';
    } else {
      nicknameHelperText = '사용 가능한 닉네임 입니다!';
    }
    const newInputHelper = {
      ...inputHelpers,
      nickname: nicknameHelperText,
    };

    setInputHelpers(newInputHelper);
  };

  const onImageChange = (e: any) => {
    const image = e.target.files[0] as File;
    const reader = new FileReader();
    reader.readAsDataURL(image);
    reader.onloadend = (finishedEvent: any) => {
      const {
        currentTarget: { result },
      } = finishedEvent;
      setImageUrl(result);
    };
    setImageExt(e.target.value.split('.')[1]);
    e.target.value = '';
  };
  const onClearImg = () => setImageUrl('');
  return (
    <>
      <Main>
        <h1 style={{ color: '#8946A6' }}>회원가입</h1>
        <GoogleButton //onClick={signInWithPopup}
        >
          구글 계정으로 가입하기
        </GoogleButton>
        <form onSubmit={SignUpSubmitHandler}>
          <WrapContents>
            <WrapInput>
              <Label>Email</Label>
              <TextFields
                required
                placeholder="Email 주소를 입력해 주세요."
                name="email"
                value={email}
                onChange={onInputChange}
                helperText={inputHelpers.email}
              />
            </WrapInput>
            <WrapInput>
              <Label>비밀번호</Label>
              <TextFields
                required
                type="password"
                placeholder="비밀번호는 6자리 이상 입력해주세요."
                variant="outlined"
                margin="dense"
                name="password"
                value={password}
                onChange={onInputChange}
                helperText={inputHelpers.password}
              />
              <TextFields
                required
                type="password"
                placeholder="비밀번호를 한 번더 입력해 주세요."
                variant="outlined"
                margin="dense"
                name="checkPassword"
                value={checkPassword}
                onChange={onInputChange}
                helperText={inputHelpers.checkPassword}
              />
            </WrapInput>

            <WrapInput>
              <Label>닉네임</Label>
              <TextFields
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <CheckButton type="button" onClick={checkNickname}>
                        중복확인
                      </CheckButton>
                    </InputAdornment>
                  ),
                }}
                variant="outlined"
                margin="dense"
                name="nickname"
                placeholder="닉네임을 입력해 주세요."
                value={nickname}
                onChange={onInputChange}
                helperText={inputHelpers.nickname}
              />
            </WrapInput>
            <WrapImageUpload>
              <Label>증명서</Label>
              <label
                htmlFor="contained-button-file"
                style={{ display: 'flex', flexDirection: 'column' }}
              >
                <Input
                  accept="image/*"
                  id="contained-button-file"
                  type="file"
                  onChange={onImageChange}
                />
                <Button
                  variant="contained"
                  component="span"
                  style={{ background: '#8946a6', marginLeft: 10 }}
                >
                  파일 선택
                </Button>
              </label>
              <Button
                variant="contained"
                component="span"
                onClick={onClearImg}
                style={{ background: '#8946a6', marginLeft: 10 }}
              >
                사진 지우기
              </Button>
            </WrapImageUpload>
            {imageUrl && (
              <img src={imageUrl} alt={imageUrl} width="150px" height="200px" />
            )}
            <WrapInput>
              <Label>직종</Label>
              <TextFields
                select
                variant="outlined"
                margin="dense"
                name="jobSector"
                value={jobSector}
                onChange={onInputChange}
                helperText={inputHelpers.jobSector}
              >
                {jobSectors.map((value, idx) => (
                  <MenuItem key={idx} value={value.title}>
                    {value.title}
                  </MenuItem>
                ))}
              </TextFields>
            </WrapInput>
            <SubmitButton type="submit">회원가입</SubmitButton>
          </WrapContents>
        </form>
      </Main>
    </>
  );
}

const Main = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
`;

const WrapContents = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const WrapInput = styled.div`
  display: flex;
  flex-direction: column;
  margin: 20px;
  width: 100%;
`;

const WrapImageUpload = styled.div`
  display: flex;
  flex-direction: row;
  margin: 20px;
  width: 100%;
`;

const CheckButton = styled.button`
  background: #8946a6;
  border-radius: 5px;
  border: none;
  color: white;
  width: 60px;
  height: 24px;
  margin: 5px;
  font-size: 12px;
  cursor: pointer;
  :hover {
    opacity: 0.8;
  }
`;

const GoogleButton = styled(Button)`
  background: #8946a6;
  border-radius: 5px;
  border: none;
  color: white;

  margin: 5px;
  font-size: 12px;
  cursor: pointer;
  :hover {
    opacity: 0.8;
  }
`;
const SubmitButton = styled.button`
  background: #8946a6;
  border-radius: 5px;
  border: none;
  color: white;
  width: 173px;
  height: 58px;
  font-size: 20px;
  cursor: pointer;
  :hover {
    opacity: 0.8;
  }
`;

const Label = styled.label`
  color: #8946a6;
  margin: 5px;
  ::after {
    content: '*';
    color: red;
  }
`;
const Input = styled('input')({
  display: 'none',
});

const TextFields = styled(TextField)`
  color: #8946a6;
  margin: 5px;
`;
