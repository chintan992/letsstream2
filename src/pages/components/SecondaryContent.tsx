import { useState, useEffect, useCallback } from "react";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import ContentRow from "@/components/ContentRow";
import { Media } from "@/utils/types";
import {
  getBasedOnTrueStories,
  getActionMovies,
  getComedyMovies,
  getDramaMovies,
  getThrillerMovies,
  getSciFiMovies,
  getHorrorMovies,
  getRomanceMovies,
  getAnimationMovies,
  getFamilyMovies,
  getDocumentaryMovies,
  getMysteryMovies,
  getFantasyMovies,
  getBingeWorthySeries,
  getMoviesForKids,
  getHollywoodMovies,
  getBollywoodMovies,
  getKoreanDramas,
  getJapaneseAnime,
  getEuropeanCinema,
  getYouTubeOriginals,
  getHBOMax,
  getPeacock,
  getCrunchyroll,
} from "@/utils/api";

const SecondaryContent = () => {
  const [content, setContent] = useState<{
    basedOnTrueStories: Media[];
    actionMovies: Media[];
    comedyMovies: Media[];
    dramaMovies: Media[];
    thrillerMovies: Media[];
    sciFiMovies: Media[];
    horrorMovies: Media[];
    romanceMovies: Media[];
    animationMovies: Media[];
    familyMovies: Media[];
    documentaryMovies: Media[];
    mysteryMovies: Media[];
    fantasyMovies: Media[];
    bingeSeries: Media[];
    moviesForKids: Media[];
    hollywoodMovies: Media[];
    bollywoodMovies: Media[];
    koreanDramas: Media[];
    japaneseAnime: Media[];
    europeanCinema: Media[];
    youTubeOriginals: Media[];
    hboMax: Media[];
    peacock: Media[];
    crunchyroll: Media[];
  }>({
    basedOnTrueStories: [],
    actionMovies: [],
    comedyMovies: [],
    dramaMovies: [],
    thrillerMovies: [],
    sciFiMovies: [],
    horrorMovies: [],
    romanceMovies: [],
    animationMovies: [],
    familyMovies: [],
    documentaryMovies: [],
    mysteryMovies: [],
    fantasyMovies: [],
    bingeSeries: [],
    moviesForKids: [],
    hollywoodMovies: [],
    bollywoodMovies: [],
    koreanDramas: [],
    japaneseAnime: [],
    europeanCinema: [],
    youTubeOriginals: [],
    hboMax: [],
    peacock: [],
    crunchyroll: [],
  });
  const {
    basedOnTrueStories,
    actionMovies,
    comedyMovies,
    dramaMovies,
    thrillerMovies,
    sciFiMovies,
    horrorMovies,
    romanceMovies,
    animationMovies,
    familyMovies,
    documentaryMovies,
    mysteryMovies,
    fantasyMovies,
    bingeSeries,
    moviesForKids,
    hollywoodMovies,
    bollywoodMovies,
    koreanDramas,
    japaneseAnime,
    europeanCinema,
    youTubeOriginals,
    hboMax,
    peacock,
    crunchyroll,
  } = content;

  const [actionPage, setActionPage] = useState(1);
  const [isLoadingMoreAction, setIsLoadingMoreAction] = useState(false);
  const [comedyPage, setComedyPage] = useState(1);
  const [isLoadingMoreComedy, setIsLoadingMoreComedy] = useState(false);
  const [dramaPage, setDramaPage] = useState(1);
  const [isLoadingMoreDrama, setIsLoadingMoreDrama] = useState(false);
  const [thrillerPage, setThrillerPage] = useState(1);
  const [isLoadingMoreThriller, setIsLoadingMoreThriller] = useState(false);
  const [sciFiPage, setSciFiPage] = useState(1);
  const [isLoadingMoreSciFi, setIsLoadingMoreSciFi] = useState(false);
  const [horrorPage, setHorrorPage] = useState(1);
  const [isLoadingMoreHorror, setIsLoadingMoreHorror] = useState(false);
  const [romancePage, setRomancePage] = useState(1);
  const [isLoadingMoreRomance, setIsLoadingMoreRomance] = useState(false);
  const [animationPage, setAnimationPage] = useState(1);
  const [isLoadingMoreAnimation, setIsLoadingMoreAnimation] = useState(false);
  const [familyPage, setFamilyPage] = useState(1);
  const [isLoadingMoreFamily, setIsLoadingMoreFamily] = useState(false);
  const [documentaryPage, setDocumentaryPage] = useState(1);
  const [isLoadingMoreDocumentary, setIsLoadingMoreDocumentary] =
    useState(false);
  const [mysteryPage, setMysteryPage] = useState(1);
  const [isLoadingMoreMystery, setIsLoadingMoreMystery] = useState(false);
  const [fantasyPage, setFantasyPage] = useState(1);
  const [isLoadingMoreFantasy, setIsLoadingMoreFantasy] = useState(false);

  // Infinite scroll callbacks and refs for each genre row
  const loadMoreAction = useCallback(async () => {
    if (isLoadingMoreAction) return;
    setIsLoadingMoreAction(true);
    const nextPage = actionPage + 1;
    const newMovies = await getActionMovies(nextPage);
    setContent(prev => ({
      ...prev,
      actionMovies: [...prev.actionMovies, ...newMovies],
    }));
    setActionPage(nextPage);
    setIsLoadingMoreAction(false);
  }, [actionPage, isLoadingMoreAction]);
  const actionLoadMoreRef = useInfiniteScroll(
    loadMoreAction,
    isLoadingMoreAction
  );

  const loadMoreComedy = useCallback(async () => {
    if (isLoadingMoreComedy) return;
    setIsLoadingMoreComedy(true);
    const nextPage = comedyPage + 1;
    const newMovies = await getComedyMovies(nextPage);
    setContent(prev => ({
      ...prev,
      comedyMovies: [...prev.comedyMovies, ...newMovies],
    }));
    setComedyPage(nextPage);
    setIsLoadingMoreComedy(false);
  }, [comedyPage, isLoadingMoreComedy]);
  const comedyLoadMoreRef = useInfiniteScroll(
    loadMoreComedy,
    isLoadingMoreComedy
  );

  const loadMoreDrama = useCallback(async () => {
    if (isLoadingMoreDrama) return;
    setIsLoadingMoreDrama(true);
    const nextPage = dramaPage + 1;
    const newMovies = await getDramaMovies(nextPage);
    setContent(prev => ({
      ...prev,
      dramaMovies: [...prev.dramaMovies, ...newMovies],
    }));
    setDramaPage(nextPage);
    setIsLoadingMoreDrama(false);
  }, [dramaPage, isLoadingMoreDrama]);
  const dramaLoadMoreRef = useInfiniteScroll(loadMoreDrama, isLoadingMoreDrama);

  const loadMoreThriller = useCallback(async () => {
    if (isLoadingMoreThriller) return;
    setIsLoadingMoreThriller(true);
    const nextPage = thrillerPage + 1;
    const newMovies = await getThrillerMovies(nextPage);
    setContent(prev => ({
      ...prev,
      thrillerMovies: [...prev.thrillerMovies, ...newMovies],
    }));
    setThrillerPage(nextPage);
    setIsLoadingMoreThriller(false);
  }, [thrillerPage, isLoadingMoreThriller]);
  const thrillerLoadMoreRef = useInfiniteScroll(
    loadMoreThriller,
    isLoadingMoreThriller
  );

  const loadMoreSciFi = useCallback(async () => {
    if (isLoadingMoreSciFi) return;
    setIsLoadingMoreSciFi(true);
    const nextPage = sciFiPage + 1;
    const newMovies = await getSciFiMovies(nextPage);
    setContent(prev => ({
      ...prev,
      sciFiMovies: [...prev.sciFiMovies, ...newMovies],
    }));
    setSciFiPage(nextPage);
    setIsLoadingMoreSciFi(false);
  }, [sciFiPage, isLoadingMoreSciFi]);
  const sciFiLoadMoreRef = useInfiniteScroll(loadMoreSciFi, isLoadingMoreSciFi);

  const loadMoreHorror = useCallback(async () => {
    if (isLoadingMoreHorror) return;
    setIsLoadingMoreHorror(true);
    const nextPage = horrorPage + 1;
    const newMovies = await getHorrorMovies(nextPage);
    setContent(prev => ({
      ...prev,
      horrorMovies: [...prev.horrorMovies, ...newMovies],
    }));
    setHorrorPage(nextPage);
    setIsLoadingMoreHorror(false);
  }, [horrorPage, isLoadingMoreHorror]);
  const horrorLoadMoreRef = useInfiniteScroll(
    loadMoreHorror,
    isLoadingMoreHorror
  );

  const loadMoreRomance = useCallback(async () => {
    if (isLoadingMoreRomance) return;
    setIsLoadingMoreRomance(true);
    const nextPage = romancePage + 1;
    const newMovies = await getRomanceMovies(nextPage);
    setContent(prev => ({
      ...prev,
      romanceMovies: [...prev.romanceMovies, ...newMovies],
    }));
    setRomancePage(nextPage);
    setIsLoadingMoreRomance(false);
  }, [romancePage, isLoadingMoreRomance]);
  const romanceLoadMoreRef = useInfiniteScroll(
    loadMoreRomance,
    isLoadingMoreRomance
  );

  const loadMoreAnimation = useCallback(async () => {
    if (isLoadingMoreAnimation) return;
    setIsLoadingMoreAnimation(true);
    const nextPage = animationPage + 1;
    const newMovies = await getAnimationMovies(nextPage);
    setContent(prev => ({
      ...prev,
      animationMovies: [...prev.animationMovies, ...newMovies],
    }));
    setAnimationPage(nextPage);
    setIsLoadingMoreAnimation(false);
  }, [animationPage, isLoadingMoreAnimation]);
  const animationLoadMoreRef = useInfiniteScroll(
    loadMoreAnimation,
    isLoadingMoreAnimation
  );

  const loadMoreFamily = useCallback(async () => {
    if (isLoadingMoreFamily) return;
    setIsLoadingMoreFamily(true);
    const nextPage = familyPage + 1;
    const newMovies = await getFamilyMovies(nextPage);
    setContent(prev => ({
      ...prev,
      familyMovies: [...prev.familyMovies, ...newMovies],
    }));
    setFamilyPage(nextPage);
    setIsLoadingMoreFamily(false);
  }, [familyPage, isLoadingMoreFamily]);
  const familyLoadMoreRef = useInfiniteScroll(
    loadMoreFamily,
    isLoadingMoreFamily
  );

  const loadMoreDocumentary = useCallback(async () => {
    if (isLoadingMoreDocumentary) return;
    setIsLoadingMoreDocumentary(true);
    const nextPage = documentaryPage + 1;
    const newMovies = await getDocumentaryMovies(nextPage);
    setContent(prev => ({
      ...prev,
      documentaryMovies: [...prev.documentaryMovies, ...newMovies],
    }));
    setDocumentaryPage(nextPage);
    setIsLoadingMoreDocumentary(false);
  }, [documentaryPage, isLoadingMoreDocumentary]);
  const documentaryLoadMoreRef = useInfiniteScroll(
    loadMoreDocumentary,
    isLoadingMoreDocumentary
  );

  const loadMoreMystery = useCallback(async () => {
    if (isLoadingMoreMystery) return;
    setIsLoadingMoreMystery(true);
    const nextPage = mysteryPage + 1;
    const newMovies = await getMysteryMovies(nextPage);
    setContent(prev => ({
      ...prev,
      mysteryMovies: [...prev.mysteryMovies, ...newMovies],
    }));
    setMysteryPage(nextPage);
    setIsLoadingMoreMystery(false);
  }, [mysteryPage, isLoadingMoreMystery]);
  const mysteryLoadMoreRef = useInfiniteScroll(
    loadMoreMystery,
    isLoadingMoreMystery
  );

  const loadMoreFantasy = useCallback(async () => {
    if (isLoadingMoreFantasy) return;
    setIsLoadingMoreFantasy(true);
    const nextPage = fantasyPage + 1;
    const newMovies = await getFantasyMovies(nextPage);
    setContent(prev => ({
      ...prev,
      fantasyMovies: [...prev.fantasyMovies, ...newMovies],
    }));
    setFantasyPage(nextPage);
    setIsLoadingMoreFantasy(false);
  }, [fantasyPage, isLoadingMoreFantasy]);
  const fantasyLoadMoreRef = useInfiniteScroll(
    loadMoreFantasy,
    isLoadingMoreFantasy
  );
  useEffect(() => {
    const fetchAllContent = async () => {
      try {
        const [trueStories] = await Promise.all([getBasedOnTrueStories()]);
        setContent(prev => ({ ...prev, basedOnTrueStories: trueStories }));

        const [
          action,
          comedy,
          drama,
          thriller,
          scifi,
          horror,
          romance,
          animation,
          family,
          documentary,
          mystery,
          fantasy,
        ] = await Promise.all([
          getActionMovies(1),
          getComedyMovies(),
          getDramaMovies(),
          getThrillerMovies(),
          getSciFiMovies(),
          getHorrorMovies(),
          getRomanceMovies(),
          getAnimationMovies(),
          getFamilyMovies(),
          getDocumentaryMovies(),
          getMysteryMovies(),
          getFantasyMovies(),
        ]);
        setContent(prev => ({
          ...prev,
          actionMovies: action,
          comedyMovies: comedy,
          dramaMovies: drama,
          thrillerMovies: thriller,
          sciFiMovies: scifi,
          horrorMovies: horror,
          romanceMovies: romance,
          animationMovies: animation,
          familyMovies: family,
          documentaryMovies: documentary,
          mysteryMovies: mystery,
          fantasyMovies: fantasy,
        }));

        const [binge, kids] = await Promise.all([
          getBingeWorthySeries(),
          getMoviesForKids(),
        ]);
        setContent(prev => ({
          ...prev,
          bingeSeries: binge,
          moviesForKids: kids,
        }));

        const [hollywood, bollywood, korean, anime, euro] = await Promise.all([
          getHollywoodMovies(),
          getBollywoodMovies(),
          getKoreanDramas(),
          getJapaneseAnime(),
          getEuropeanCinema(),
        ]);
        setContent(prev => ({
          ...prev,
          hollywoodMovies: hollywood,
          bollywoodMovies: bollywood,
          koreanDramas: korean,
          japaneseAnime: anime,
          europeanCinema: euro,
        }));

        const [yt, hbo, pea, crun] = await Promise.all([
          getYouTubeOriginals(),
          getHBOMax(),
          getPeacock(),
          getCrunchyroll(),
        ]);
        setContent(prev => ({
          ...prev,
          youTubeOriginals: yt,
          hboMax: hbo,
          peacock: pea,
          crunchyroll: crun,
        }));
      } catch (error) {
        console.error("Error fetching homepage content:", error);
      }
    };
    fetchAllContent();
  }, []);

  return (
    <>
      {/* Thematic/Curated Rows */}
      {basedOnTrueStories.length > 0 && (
        <ContentRow title="Based on True Stories" media={basedOnTrueStories} />
      )}

      {/* Genre-Based Rows (all with infinite scroll) */}
      {actionMovies.length > 0 && (
        <ContentRow
          title="Action"
          media={actionMovies}
          loadMoreRef={actionLoadMoreRef}
          isLoadingMore={isLoadingMoreAction}
        />
      )}
      {comedyMovies.length > 0 && (
        <ContentRow
          title="Comedy"
          media={comedyMovies}
          loadMoreRef={comedyLoadMoreRef}
          isLoadingMore={isLoadingMoreComedy}
        />
      )}
      {dramaMovies.length > 0 && (
        <ContentRow
          title="Drama"
          media={dramaMovies}
          loadMoreRef={dramaLoadMoreRef}
          isLoadingMore={isLoadingMoreDrama}
        />
      )}
      {thrillerMovies.length > 0 && (
        <ContentRow
          title="Thriller"
          media={thrillerMovies}
          loadMoreRef={thrillerLoadMoreRef}
          isLoadingMore={isLoadingMoreThriller}
        />
      )}
      {sciFiMovies.length > 0 && (
        <ContentRow
          title="Sci-Fi"
          media={sciFiMovies}
          loadMoreRef={sciFiLoadMoreRef}
          isLoadingMore={isLoadingMoreSciFi}
        />
      )}
      {horrorMovies.length > 0 && (
        <ContentRow
          title="Horror"
          media={horrorMovies}
          loadMoreRef={horrorLoadMoreRef}
          isLoadingMore={isLoadingMoreHorror}
        />
      )}
      {romanceMovies.length > 0 && (
        <ContentRow
          title="Romance"
          media={romanceMovies}
          loadMoreRef={romanceLoadMoreRef}
          isLoadingMore={isLoadingMoreRomance}
        />
      )}
      {animationMovies.length > 0 && (
        <ContentRow
          title="Animation"
          media={animationMovies}
          loadMoreRef={animationLoadMoreRef}
          isLoadingMore={isLoadingMoreAnimation}
        />
      )}
      {familyMovies.length > 0 && (
        <ContentRow
          title="Family"
          media={familyMovies}
          loadMoreRef={familyLoadMoreRef}
          isLoadingMore={isLoadingMoreFamily}
        />
      )}
      {documentaryMovies.length > 0 && (
        <ContentRow
          title="Documentary"
          media={documentaryMovies}
          loadMoreRef={documentaryLoadMoreRef}
          isLoadingMore={isLoadingMoreDocumentary}
        />
      )}
      {mysteryMovies.length > 0 && (
        <ContentRow
          title="Mystery"
          media={mysteryMovies}
          loadMoreRef={mysteryLoadMoreRef}
          isLoadingMore={isLoadingMoreMystery}
        />
      )}
      {fantasyMovies.length > 0 && (
        <ContentRow
          title="Fantasy"
          media={fantasyMovies}
          loadMoreRef={fantasyLoadMoreRef}
          isLoadingMore={isLoadingMoreFantasy}
        />
      )}

      {/* Binge/For Kids */}
      {bingeSeries.length > 0 && (
        <ContentRow title="Binge-Worthy Series" media={bingeSeries} />
      )}
      {moviesForKids.length > 0 && (
        <ContentRow title="Movies for Kids" media={moviesForKids} />
      )}

      {/* Regional/Language Rows */}
      {hollywoodMovies.length > 0 && (
        <ContentRow title="Hollywood" media={hollywoodMovies} />
      )}
      {bollywoodMovies.length > 0 && (
        <ContentRow title="Bollywood" media={bollywoodMovies} />
      )}
      {koreanDramas.length > 0 && (
        <ContentRow title="Korean Dramas" media={koreanDramas} />
      )}
      {japaneseAnime.length > 0 && (
        <ContentRow title="Japanese Anime" media={japaneseAnime} />
      )}
      {europeanCinema.length > 0 && (
        <ContentRow title="European Cinema" media={europeanCinema} />
      )}

      {/* Platform/Provider Rows */}
      {youTubeOriginals.length > 0 && (
        <ContentRow title="YouTube Originals" media={youTubeOriginals} />
      )}
      {hboMax.length > 0 && <ContentRow title="HBO Max" media={hboMax} />}
      {peacock.length > 0 && <ContentRow title="Peacock" media={peacock} />}
      {crunchyroll.length > 0 && (
        <ContentRow title="Crunchyroll" media={crunchyroll} />
      )}
    </>
  );
};

export default SecondaryContent;
