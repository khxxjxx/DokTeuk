import React, { useState, useEffect, useReducer } from 'react';
import { useDispatch } from 'react-redux';
import styled from '@emotion/styled';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { signOut } from 'firebase/auth';
import { db, auth } from '@firebase/firebase';
import FormHelperText from '@mui/material/FormHelperText';
import {
  doc,
  setDoc,
  getDocs,
  collection,
  query,
  where,
} from 'firebase/firestore';

import { useRouter } from 'next/router';
import MenuItem from '@mui/material/MenuItem';
import { UserInfo, Rounge } from '@interface/StoreInterface';
import { HomeListUrlString } from '@interface/GetPostsInterface';
import {
  UserInputData,
  userInputInitialState,
  jobSectors,
  OcrData,
  UserInputDataAction,
} from '@interface/constants';
import { getAuth } from 'firebase/auth';
import { userInputChangeValidation } from '@utils/userInputValidation';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { GetServerSideProps, GetServerSidePropsContext } from 'next';
import { validateData, getOcrData } from '@utils/ocrDataValidation';
import { uploadImg } from '@utils/signupForm';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import CircularProgress from '@mui/material/CircularProgress';
const reducer = (state: UserInputData, action: UserInputDataAction) => {
  return {
    ...state,
    [action.type]: { value: action.payload.value, error: action.payload.error },
  };
};

export default function Google() {
  const router = useRouter();
  const dispatch = useDispatch();

  const [inputState, inputDispatch] = useReducer(
    reducer,
    userInputInitialState,
  );
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageExt, setImageExt] = useState<string>('');
  const [nicknameBtnChecked, setNicknameBtnChecked] = useState<boolean>(false);
  const [nicknameSuccess, setNicknameSuccess] = useState<string>('');
  const [imageOcrChecked, setImageOcrChecked] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [ocrData, setOcrData] = useState<OcrData>({
    bNo: '',
    startDate: '',
    pName: '',
  });
  const { email, nickname, jobSector } = inputState;
  useEffect(() => {
    const auth = getAuth();
    const curUser = auth.currentUser;
    inputDispatch({
      type: 'email',
      payload: { value: curUser?.email as string, error: '' },
    });
  }, []);

  const handleClose = () => {
    setDialogOpen(false);
    setIsLoading(false);
  };
  const submitButtonDisabled = () => {
    if (jobSector.error) {
      return true;
    } else {
      return !(nicknameBtnChecked && imageOcrChecked);
    }
  };
  const SignUpSubmitHandler = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const uid = auth.currentUser?.uid as string;
    if (!uid) {
      alert('?????? ????????? ????????????!');
      router.push('/user/login');
    }
    if (!imageUrl) {
      alert('????????? ????????? ?????? ??? ????????????!');
      return;
    }

    const userData: UserInfo = {
      nickname: nickname.value,
      jobSector: jobSector.value,
      validRounges: [
        {
          title: '????????????',
          url: 'timeline',
        },
        {
          title: '??????',
          url: 'topic',
        },
        {
          title: jobSector.value,
          url: jobSectors.find((v) => v.title === jobSector.value)
            ?.url as HomeListUrlString,
        } as Rounge,
      ],
      id: uid,
      hasNewNotification: false,
      hasNewChatNotification: false,
      posts: [],
      email: email.value,
    };
    uploadImg(uid, imageExt, imageUrl);
    const docSnap = await setDoc(doc(db, 'user', uid), userData);
    await signOut(auth);
    router.push('/user/login');
  };

  const checkNickname = async () => {
    const nicknameCheckQuery = query(
      collection(db, 'user'),
      where('nickname', '==', nickname.value),
    );
    const nicknameCheckSnap = await getDocs(nicknameCheckQuery);
    let nicknameHelperText;
    if (nicknameCheckSnap.docs.length !== 0 || nickname.value.length < 3) {
      nicknameHelperText = '?????? ???????????? ????????? ?????????!';
    } else {
      nicknameHelperText = '';
      setNicknameBtnChecked(true);
      setNicknameSuccess('?????? ????????? ????????? ?????????!');
    }

    inputDispatch({
      type: 'nickname',
      payload: { value: nickname.value, error: nicknameHelperText },
    });
  };

  const getImageToString = async () => {
    setIsLoading(true);
    const result = await getOcrData(imageUrl, imageExt);
    setIsLoading(false);
    if (!result) {
      alert('??????????????? ???????????? ????????? ?????? ???????????????!');
      resetOcrData();
    } else {
      const { bNo, pName, startDate } = result as OcrData;
      const newOcrData = { bNo, pName, startDate };
      setOcrData(newOcrData);
      setDialogOpen(true);
    }
  };

  const validateOcrData = async () => {
    setIsLoading(true);
    const validateResult = await validateData(ocrData);
    if (validateResult) {
      alert('?????? ??????!');
      setImageOcrChecked(true);
      handleClose();
    } else {
      alert('?????? ??????! ???????????? ?????? ?????? ??? ?????????!');
      handleClose();
    }
  };

  const resetOcrData = () => {
    const resetOcrData = { bNo: '', pName: '', startDate: '' };
    setOcrData(resetOcrData);
  };

  const onImageChange = (e: any) => {
    const image = e.target.files[0]!;
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
    setImageOcrChecked(false);

    resetOcrData();
  };

  const onClearImg = () => {
    setImageUrl('');
    setImageOcrChecked(false);
    resetOcrData();
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'nickname' && nicknameBtnChecked) {
      setNicknameBtnChecked(false);
      setNicknameSuccess('');
    }
    const error = userInputChangeValidation(name, value, inputState);
    inputDispatch({ type: name, payload: { value, error } });
  };

  return (
    <>
      <Main>
        <Title>????????????</Title>
        <form onSubmit={SignUpSubmitHandler}>
          <WrapContents>
            <WrapInput>
              <Label>Email</Label>
              <TextFields required disabled name="email" value={email.value} />
            </WrapInput>
            <WrapInput>
              <Label>?????????</Label>
              <TextFields
                required
                error={nickname.error ? true : false}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <CheckButton
                        type="button"
                        onClick={checkNickname}
                        disabled={nicknameBtnChecked}
                      >
                        ????????????
                      </CheckButton>
                    </InputAdornment>
                  ),
                }}
                variant="outlined"
                margin="dense"
                name="nickname"
                placeholder="???????????? ????????? ?????????."
                value={nickname.value}
                onChange={onInputChange}
                helperText={nickname.error}
              />
              {nicknameSuccess && (
                <StyledFormHelperText>{nicknameSuccess}</StyledFormHelperText>
              )}
            </WrapInput>
            <WrapImageUpload>
              <Label>?????????</Label>
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
                <ButtonStyled variant="contained" component="span">
                  <CameraAltIcon style={{ marginRight: '5px' }} />
                  ?????? ??????
                </ButtonStyled>
              </label>
              <ButtonStyled
                variant="contained"
                component="span"
                onClick={onClearImg}
              >
                <DeleteForeverIcon style={{ marginRight: '5px' }} />
                ?????? ?????????
              </ButtonStyled>
            </WrapImageUpload>
            {imageUrl && (
              <>
                <img
                  src={imageUrl}
                  alt={imageUrl}
                  width="150px"
                  height="200px"
                />
                <WrapButton>
                  <OcrButton
                    type="button"
                    variant="contained"
                    disabled={imageOcrChecked}
                    onClick={getImageToString}
                  >
                    <FactCheckIcon style={{ marginRight: '5px' }} />
                    ????????????
                  </OcrButton>
                  {isLoading && <StyledCircularProgress />}
                </WrapButton>
              </>
            )}
            <WrapInput>
              <Label>??????</Label>
              <TextFields
                select
                error={jobSector.error ? true : false}
                variant="outlined"
                margin="dense"
                name="jobSector"
                value={jobSector.value}
                onChange={onInputChange}
                helperText={jobSector.error}
              >
                {jobSectors.map((value, idx) => (
                  <MenuItem key={idx} value={value.title}>
                    {value.title}
                  </MenuItem>
                ))}
              </TextFields>
            </WrapInput>
            <SubmitButton type="submit" disabled={submitButtonDisabled()}>
              <GroupAddIcon style={{ marginRight: '10px' }} />
              ????????????
            </SubmitButton>
          </WrapContents>
        </form>
        <>
          <Dialog
            open={dialogOpen}
            onClose={handleClose}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
          >
            <DialogTitle id="alert-dialog-title">
              {'????????? ????????? ?????????????????????????'}
            </DialogTitle>
            <DialogContent>
              <DialogContentText id="alert-dialog-description">
                ?????????????????????: {ocrData.bNo}
                <br />
                ?????????: {ocrData.pName}
                <br />
                ???????????????: {ocrData.startDate}
                <br />
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <DialogButton onClick={validateOcrData} autoFocus>
                ????????????
              </DialogButton>
              <DialogButton onClick={handleClose}>?????? ?????????</DialogButton>
            </DialogActions>
          </Dialog>
        </>
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

const Title = styled.h1`
  color: ${({ theme }: any) => theme.mainColorViolet};

  @media (prefers-color-scheme: dark) {
    color: ${({ theme }: any) => theme.mainColorBlue};
  }
`;

const Main = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
`;

const WrapContents = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  & .MuiOutlinedInput-input {
    color: black;
  }
  & .MuiOutlinedInput-root {
    border: 1px solid ${({ theme }: any) => theme.lightGray};
  }
  & input:-webkit-autofill {
    -webkit-box-shadow: 0 0 0 1000px #eaeaea inset;
    border-radius: 0;
    -webkit-text-fill-color: #000000 !important;
  }

  @media (prefers-color-scheme: dark) {
    & .MuiFormHelperText-root {
      color: ${({ theme }: any) => theme.lightGray};
    }
    & .MuiOutlinedInput-input {
      color: white;
    }
    & .MuiOutlinedInput-root {
      border: 1px solid ${({ theme }: any) => theme.darkGray};
    }
    & .MuiSvgIcon-root {
      color: ${({ theme }: any) => theme.lightGray};
    }
    & input.Mui-disabled {
      text-fill-color: ${({ theme }: any) => theme.darkGray};
    }
    & input:-webkit-autofill {
      -webkit-box-shadow: 0 0 0 1000px #111113 inset;
      border-radius: 0;
      -webkit-text-fill-color: #fff !important;
      caret-color: white;
    }
  }
`;
const WrapButton = styled.div`
  margin: 10px;
  align-item: center;
  display: flex;
  align-items: center;
  flex-direction: row;
  justify-content: center;
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

const ButtonStyled = styled(Button)<{ component: string }>`
  margin-left: 10px;
  background: ${({ theme }: any) => theme.mainColorViolet};

  :hover {
    opacity: 0.8;
    background: ${({ theme }: any) => theme.mainColorViolet};
  }

  @media (prefers-color-scheme: dark) {
    background: ${({ theme }: any) => theme.mainColorBlue};
    :hover {
      opacity: 0.8;
      background: ${({ theme }: any) => theme.mainColorBlue};
    }
  }
`;

const CheckButton = styled.button`
  background: ${({ theme }: any) => theme.mainColorViolet};
  border-radius: 5px;
  border: none;
  color: white;
  width: 75px;
  height: 25px;
  margin: 5px;
  font-size: 12px;
  cursor: pointer;
  :hover {
    opacity: 0.8;
    background: ${({ theme }: any) => theme.mainColorViolet};
  }
  :disabled {
    background: gray;
  }
  @media (prefers-color-scheme: dark) {
    background: ${({ theme }: any) => theme.mainColorBlue};
    :hover {
      opacity: 0.8;
      background: ${({ theme }: any) => theme.mainColorBlue};
    }
    :disabled {
      background: gray;
    }
  }
`;

const SubmitButton = styled.button`
  background: ${({ theme }: any) => theme.mainColorViolet};
  border-radius: 5px;
  border: none;
  color: white;
  width: 173px;
  height: 58px;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 25px;
  :hover {
    opacity: 0.8;
  }
  :disabled {
    background: gray;
  }
  @media (prefers-color-scheme: dark) {
    background: ${({ theme }: any) => theme.mainColorBlue};
  }
`;

const Label = styled.label`
  color: ${({ theme }: any) => theme.mainColorViolet};
  margin: 5px;
  ::after {
    content: '*';
    color: red;
  }
  @media (prefers-color-scheme: dark) {
    color: ${({ theme }: any) => theme.mainColorBlue};
  }
`;
const Input = styled('input')({
  display: 'none',
});

const TextFields = styled(TextField)`
  color: ${({ theme }: any) => theme.mainColorViolet};
  margin: 5px;
`;

const OcrButton = styled(Button)`
  background: ${({ theme }: any) => theme.mainColorViolet};
  margin-top: 15px;
  :disabled {
    background: 'gray';
  }
  :hover {
    opacity: 0.8;
    background: ${({ theme }: any) => theme.mainColorViolet};
  }
  @media (prefers-color-scheme: dark) {
    background: ${({ theme }: any) => theme.mainColorBlue};
    :hover {
      opacity: 0.8;
      background: ${({ theme }: any) => theme.mainColorBlue};
    }
    :disabled {
      background: 'gray';
    }
  }
`;
const DialogButton = styled(Button)`
  color: ${({ theme }: any) => theme.mainColorViolet};

  @media (prefers-color-scheme: dark) {
    color: ${({ theme }: any) => theme.mainColorBlue};
  }
`;

const StyledCircularProgress = styled(CircularProgress)`
  color: ${({ theme }: any) => theme.mainColorViolet};
  margin-left: 10px;
  margin-top: 15px;

  @media (prefers-color-scheme: dark) {
    color: ${({ theme }: any) => theme.mainColorBlue};
    margin-left: 10px;
    margin-top: 15px;
  }
`;

const StyledFormHelperText = styled(FormHelperText)`
  color: ${({ theme }: any) => theme.mainColorViolet};
  margin-left: 10px;

  @media (prefers-color-scheme: dark) {
    color: ${({ theme }: any) => theme.mainColorBlue};
    margin-left: 10px;
  }
`;
