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
            <WrapButton>
              <Link href="/user/email" passHref>
                <SignupButton>
                  <EmailIcon style={{ marginRight: '5px' }} />
                  <div>이메일 계정으로 회원가입</div>
                </SignupButton>
              </Link>
            </WrapButton>
            <WrapButton>
              <SignupButton onClick={loginWithGoogle}>
                <GoogleIcon style={{ marginRight: '5px' }} />
                구글 계정으로 회원가입
              </SignupButton>
            </WrapButton>
          </WrapInput>
          <WrapInput>
            <h3 style={{ color: '#8946A6' }}>이미 가입되어 있으신가요?</h3>
            <WrapButton>
              <Link href="/user/login" passHref>
                <SignupButton>
                  <LoginIcon style={{ marginRight: '5px' }} />
                  로그인 페이지로 이동하기
                </SignupButton>
              </Link>
            </WrapButton>
          </WrapInput>
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
    context.res.setHeader('Location', `/user/email`);
    context.res.end();
  }
  return { props: {} };
};

const Main = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
  padding-bottom: 30px;
`;

const WrapContents = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  & .MuiOutlinedInput-input {
    color: black;
  }
  & .MuiOutlinedInput-root {
    border: 1px solid ${({ theme }: any) => theme.darkGray};
  }

  @media (prefers-color-scheme: dark) {
    & .MuiOutlinedInput-input {
      color: white;
    }
    & .MuiOutlinedInput-root {
      border: 1px solid ${({ theme }: any) => theme.lightGray};
    }
    & .MuiFormHelperText-root {
      color: ${({ theme }: any) => theme.lightGray};
    }
    & .MuiSvgIcon-root {
      color: ${({ theme }: any) => theme.lightGray};
    }
  }
`;

const WrapInput = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
  width: 100%;
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  flex-direction: row;
  justify-content: center;
  background: #8946a6;
  border-radius: 5px;
  border: none;
  color: white;
  width: 200px;
  height: 50px;
  font-size: 12px;
  cursor: pointer;
  :hover {
    opacity: 0.8;
  }
`;

const WrapButton = styled.div`
  margin: 10px;
  width: 313px;
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
