import { FormEvent, useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { useDispatch, useSelector } from 'react-redux';
import {
  getUser,
  initialViewAction,
  resetViewAction,
  setScrollAction,
  setSearchValueAction,
  setViewAction,
} from 'store/reducer';
import { useInView } from 'react-intersection-observer';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';

import { TopicPost, RoungePost } from '@interface/CardInterface';
import { StoreState, UserState, ViewPosts } from '@interface/StoreInterface';
import { RoungeCard, TopicCard } from '@components/Card';
import { ChildrenWrapperDivStyled } from '@layouts/Layout';
import Footer from '@layouts/Footer';
import { HeaderWrapperDivStyled } from '@layouts/Header';
import { searchInfiniteFunction } from '@utils/function';
import { useRouter } from 'next/router';
import { GetServerSideProps, GetServerSidePropsContext } from 'next';
import useDebounce from '@hooks/useDebounce';
import wrapper from '@store/configureStore';

const Search = () => {
  const dispatch = useDispatch();
  const { view, searchValue }: ViewPosts = useSelector(
    (state: StoreState) => state.view,
  );
  const { user: myInfo }: UserState = useSelector(
    (state: StoreState) => state.user,
  );

  const { ref, inView } = useInView();
  useEffect(() => {
    if (view.length === 0 && searchValue) {
      (async () => {
        dispatch(
          initialViewAction(
            await searchInfiniteFunction(
              searchValue,
              0,
              myInfo.validRounges.map((v) => v.url),
            ),
          ),
        );
      })();
    }
  }, [searchValue, view]);
  useEffect(() => {
    if (inView) {
      (async () => {
        dispatch(
          setViewAction(
            await searchInfiniteFunction(
              searchValue,
              view[view.length - 1].nextPage,
              myInfo.validRounges.map((v) => v.url),
            ),
          ),
        );
      })();
    }
  }, [inView]);
  const renderData = view.flatMap((value: any) => value.result) ?? [];
  if (renderData.length > 0) {
    return (
      <SearchResultsWrapperDiv>
        {(renderData as Array<TopicPost | RoungePost>)?.map((post, i) => {
          let isLiked = false;
          if (myInfo?.id) {
            // @ts-ignore
            if (post.pressPerson.indexOf(myInfo.id) !== -1) isLiked = true;
          }
          if (i === (renderData as Array<TopicPost | RoungePost>).length - 20) {
            return post.postType === 'topic' ? (
              <TopicCard
                topicCardData={post}
                key={post.postId}
                ref={ref}
                isLiked={isLiked}
              />
            ) : (
              <RoungeCard
                roungeCardData={post}
                key={post.postId}
                ref={ref}
                isLiked={isLiked}
              />
            );
          }
          return post.postType === 'topic' ? (
            <TopicCard
              topicCardData={post}
              key={post.postId}
              isLiked={isLiked}
            />
          ) : (
            <RoungeCard
              roungeCardData={post}
              key={post.postId}
              isLiked={isLiked}
            />
          );
        })}
      </SearchResultsWrapperDiv>
    );
  }
  return (
    <SearchPageWrapperDiv>????????? ????????? ????????? ????????????.</SearchPageWrapperDiv>
  );
};
const WrappedSearch = ({ referer }: { referer: -1 | 1 }) => {
  const router = useRouter();
  const dispatch = useDispatch();
  // useEffect(() => {
  //   if (!myInfo) dispatch(getUser());
  // }, [myInfo, dispatch]);
  const { user: myInfo } = useSelector((state: StoreState) => state.user);
  const { scrollY } = useSelector((state: StoreState) => state.scroll);
  const [searchValue, setSearchValue] = useState('');
  const paddingFunction = useDebounce({
    cb: () => window.scrollY !== 0 && dispatch(setScrollAction(window.scrollY)),
    ms: 100,
  });
  useEffect(() => {
    if (referer === -1) {
      dispatch(setSearchValueAction(''));
      dispatch(resetViewAction());
    }
    window.addEventListener('scroll', paddingFunction);
    return () => {
      window.removeEventListener('scroll', paddingFunction);
      // dispatch(resetViewAction());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // useEffect(() => {
  //   if (!myInfo) dispatch(getUser());
  // }, [myInfo, dispatch]);
  useEffect(() => {
    if (referer === -1) {
      dispatch(resetViewAction());
      dispatch(setScrollAction(0));
    } else {
      window.scrollTo({ top: scrollY });
    }
  }, [router.asPath]);

  const onSubmitSearchForm = async (e: FormEvent) => {
    e.preventDefault(); // form ???????????? ?????? refresh ??????
    const value = (
      e.currentTarget.querySelector(
        'input[name="search-value"]',
      ) as HTMLInputElement
    ).value; // form ??? input value
    if (!value) return; // value??? ?????? ??? return
    window.scrollTo({ top: 0, behavior: 'smooth' }); // ?????? ?????? ??? ???????????????
    setSearchValue(value); // value??? ??????
    dispatch(setSearchValueAction(value));
    dispatch(resetViewAction());
  };

  return (
    <>
      <HeaderWrapperDivStyled>
        <SearchWrapperStyled>
          <SearchFormStyled onSubmit={onSubmitSearchForm}>
            <SearchOutlinedIconStyled fontSize="medium" />
            <InputStyled
              name="search-value"
              type="text"
              placeholder="?????????, #????????? ??????"
            />
          </SearchFormStyled>
        </SearchWrapperStyled>
      </HeaderWrapperDivStyled>
      <ChildrenWrapperDivStyled>
        <Search />
      </ChildrenWrapperDivStyled>
      <Footer />
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (
  context: GetServerSidePropsContext,
) => {
  const returnProps: { referer: 1 | -1 } = { referer: -1 };
  // referer prop??? URL???????????? ??? undefined ?????? ????????? ''
  // search??????????????? ??????????????? ????????? -1
  if (
    context.req.headers.referer &&
    context.req.headers.referer?.split('/').indexOf('search') !== -1
  )
    returnProps.referer = 1;
  // ?????? ?????? ????????? search??? ??????????????? ???????????? ??????????????? ????????? ???
  return { props: returnProps };
};
export default WrappedSearch;

const SearchPageWrapperDiv = styled.div`
  background-color: ${({ theme }: any) => theme.whiteGray};
  color: rgb(81, 81, 83);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: left;
  height: 20vh;
  border-top: solid 1px white;
  border-bottom: solid 1px white;
  // border-top: solid 1px rgb(59, 59, 61);
  // border-bottom: solid 1px rgb(59, 59, 61);
  @media (prefers-color-scheme: dark) {
    background-color: ${({ theme }: any) => theme.mainColorBlack};
  }
`;
const SearchResultsWrapperDiv = styled.div`
  width: 100%;
  padding-bottom: 68px;
`;

const SearchWrapperStyled = styled.div`
  background-color: ${({ theme }: any) => theme.mainColorViolet};
  height: 60px;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  ${({ theme }: any) => `border-bottom: 2px solid ${theme.whiteGray}`};
  @media (prefers-color-scheme: dark) {
    background-color: ${({ theme }: any) => theme.mainColorBlack};
    ${({ theme }: any) => `border-bottom: 2px solid ${theme.blackGray}`};
  }
`;
const InputStyled = styled.input`
  background-color: white;
  color: black;
  border: 0;
  border-radius: 10px;
  height: 30px;
  padding: 1rem 0.8rem 1rem 0.8rem;
  width: 90vw;
  max-width: 600px;
  padding-left: 36px;
  transition: 0.3s;
  @media (prefers-color-scheme: dark) {
    background-color: ${({ theme }: any) => theme.blackGray};
    color: ${({ theme }: any) => theme.middleGray};
  }
`;

const SearchFormStyled = styled.form`
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
`;
const SearchOutlinedIconStyled = styled(SearchOutlinedIcon)`
  color: rgb(145, 145, 146);
  margin-right: -32px;
  z-index: 1;
`;
