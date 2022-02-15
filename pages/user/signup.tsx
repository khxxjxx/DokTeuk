import React from 'react';
import Link from 'next/link';
import styled from '@emotion/styled';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useDispatch } from 'react-redux';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@firebase/firebase';
import { useRouter } from 'next/router';
import { setNewUserInfo } from '@store/reducer';
import GoogleIcon from '@mui/icons-material/Google';
import EmailIcon from '@mui/icons-material/Email';
import LoginIcon from '@mui/icons-material/Login';
import { GetServerSideProps, GetServerSidePropsContext } from 'next';
export default function SignUpIndex() {
  const router = useRouter();
  const provider = new GoogleAuthProvider();
  const dispatch = useDispatch();

  const checkSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      return result.user.uid;
    } catch (err: any) {
      console.error(err);
    }
  };

  const loginWithGoogle = async () => {
    const uid = await checkSignIn();
    const docSnap = await getDoc(doc(db, 'user', uid as string));
    if (docSnap.exists()) {
      dispatch(setNewUserInfo(docSnap.data()));
      router.push('/');
    } else {
      router.push('/user/google');
    }
  };

  return (
    <>
      <Main>
        <h1 style={{ color: '#8946A6' }}>회원가입</h1>
        <WrapContents>
          <WrapInput>
            <Link href="/user/email" passHref>
              <SignupButton>
                <EmailIcon />
                이메일 계정으로 회원가입
              </SignupButton>
            </Link>
            <SignupButton onClick={loginWithGoogle}>
              <GoogleIcon />
              구글 계정으로 회원가입
            </SignupButton>
          </WrapInput>
          <WrapButton>
            <Label>이미 가입되어 있으시다면</Label>
          </WrapButton>
          <Link href="/user/login" passHref>
            <SignupButton>
              <LoginIcon />
              로그인 페이지로 이동하기
            </SignupButton>
          </Link>
        </WrapContents>
      </Main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (
  context: GetServerSidePropsContext,
) => {
  if (!context.req.headers.referer) {
    context.res.statusCode = 302;
    context.res.setHeader('Location', `/`);
    context.res.end();
  }
  return { props: {} };
};

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

const Button = styled.button`
  background: #8946a6;
  border-radius: 5px;
  border: none;
  color: white;
  width: 200px;
  height: 50px;
  font-size: 12px;
  cursor: pointer;
  vertical-align: middle;
  :hover {
    opacity: 0.8;
  }
`;

const WrapButton = styled.div`
  display: flex;
  justify-content: space-between;
  margin: 20px;
  width: 313px;
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
`;

const SignupButton = styled(Button)`
  background: #8946a6;
  border-radius: 5px;
  border: none;
  color: white;
  width: 100%;
  margin: 5px;
  font-size: 12px;
  cursor: pointer;
  :hover {
    opacity: 0.8;
  }
`;
