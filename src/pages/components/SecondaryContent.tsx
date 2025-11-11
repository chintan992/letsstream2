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
  // Thematic/Curated
  // ...existing code...
  const [basedOnTrueStories, setBasedOnTrueStories] = useState<Media[]>([]);
  // Genre-Based (all with infinite scroll)
  const [actionMovies, setActionMovies] = useState<Media[]>([]);
  const [actionPage, setActionPage] = useState(1);
  const [isLoadingMoreAction, setIsLoadingMoreAction] = useState(false);
  const [comedyMovies, setComedyMovies] = useState<Media[]>([]);
  const [comedyPage, setComedyPage] = useState(1);
  const [isLoadingMoreComedy, setIsLoadingMoreComedy] = useState(false);
  const [dramaMovies, setDramaMovies] = useState<Media[]>([]);
  const [dramaPage, setDramaPage] = useState(1);
  const [isLoadingMoreDrama, setIsLoadingMoreDrama] = useState(false);
  const [thrillerMovies, setThrillerMovies] = useState<Media[]>([]);
  const [thrillerPage, setThrillerPage] = useState(1);
  const [isLoadingMoreThriller, setIsLoadingMoreThriller] = useState(false);
  const [sciFiMovies, setSciFiMovies] = useState<Media[]>([]);
  const [sciFiPage, setSciFiPage] = useState(1);
  const [isLoadingMoreSciFi, setIsLoadingMoreSciFi] = useState(false);
  const [horrorMovies, setHorrorMovies] = useState<Media[]>([]);
  const [horrorPage, setHorrorPage] = useState(1);
  const [isLoadingMoreHorror, setIsLoadingMoreHorror] = useState(false);
  const [romanceMovies, setRomanceMovies] = useState<Media[]>([]);
  const [romancePage, setRomancePage] = useState(1);
  const [isLoadingMoreRomance, setIsLoadingMoreRomance] = useState(false);
  const [animationMovies, setAnimationMovies] = useState<Media[]>([]);
  const [animationPage, setAnimationPage] = useState(1);
  const [isLoadingMoreAnimation, setIsLoadingMoreAnimation] = useState(false);
  const [familyMovies, setFamilyMovies] = useState<Media[]>([]);
  const [familyPage, setFamilyPage] = useState(1);
  const [isLoadingMoreFamily, setIsLoadingMoreFamily] = useState(false);
  const [documentaryMovies, setDocumentaryMovies] = useState<Media[]>([]);
  const [documentaryPage, setDocumentaryPage] = useState(1);
  const [isLoadingMoreDocumentary, setIsLoadingMoreDocumentary] =
    useState(false);
  const [mysteryMovies, setMysteryMovies] = useState<Media[]>([]);
  const [mysteryPage, setMysteryPage] = useState(1);
  const [isLoadingMoreMystery, setIsLoadingMoreMystery] = useState(false);
  const [fantasyMovies, setFantasyMovies] = useState<Media[]>([]);
  const [fantasyPage, setFantasyPage] = useState(1);
  const [isLoadingMoreFantasy, setIsLoadingMoreFantasy] = useState(false);

  // Infinite scroll callbacks and refs for each genre row
  const loadMoreAction = useCallback(async () => {
    if (isLoadingMoreAction) return;
    setIsLoadingMoreAction(true);
    const nextPage = actionPage + 1;
    const newMovies = await getActionMovies(nextPage);
    setActionMovies(prev => [...prev, ...newMovies]);
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
    setComedyMovies(prev => [...prev, ...newMovies]);
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
    setDramaMovies(prev => [...prev, ...newMovies]);
    setDramaPage(nextPage);
    setIsLoadingMoreDrama(false);
  }, [dramaPage, isLoadingMoreDrama]);
  const dramaLoadMoreRef = useInfiniteScroll(loadMoreDrama, isLoadingMoreDrama);

  const loadMoreThriller = useCallback(async () => {
    if (isLoadingMoreThriller) return;
    setIsLoadingMoreThriller(true);
    const nextPage = thrillerPage + 1;
    const newMovies = await getThrillerMovies(nextPage);
    setThrillerMovies(prev => [...prev, ...newMovies]);
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
    setSciFiMovies(prev => [...prev, ...newMovies]);
    setSciFiPage(nextPage);
    setIsLoadingMoreSciFi(false);
  }, [sciFiPage, isLoadingMoreSciFi]);
  const sciFiLoadMoreRef = useInfiniteScroll(loadMoreSciFi, isLoadingMoreSciFi);

  const loadMoreHorror = useCallback(async () => {
    if (isLoadingMoreHorror) return;
    setIsLoadingMoreHorror(true);
    const nextPage = horrorPage + 1;
    const newMovies = await getHorrorMovies(nextPage);
    setHorrorMovies(prev => [...prev, ...newMovies]);
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
    setRomanceMovies(prev => [...prev, ...newMovies]);
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
    setAnimationMovies(prev => [...prev, ...newMovies]);
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
    setFamilyMovies(prev => [...prev, ...newMovies]);
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
    setDocumentaryMovies(prev => [...prev, ...newMovies]);
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
    setMysteryMovies(prev => [...prev, ...newMovies]);
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
    setFantasyMovies(prev => [...prev, ...newMovies]);
    setFantasyPage(nextPage);
    setIsLoadingMoreFantasy(false);
  }, [fantasyPage, isLoadingMoreFantasy]);
  const fantasyLoadMoreRef = useInfiniteScroll(
    loadMoreFantasy,
    isLoadingMoreFantasy
  );
  // Binge/For Kids
  const [bingeSeries, setBingeSeries] = useState<Media[]>([]);
  const [moviesForKids, setMoviesForKids] = useState<Media[]>([]);
  // Regional/Language
  const [hollywoodMovies, setHollywoodMovies] = useState<Media[]>([]);
  const [bollywoodMovies, setBollywoodMovies] = useState<Media[]>([]);
  const [koreanDramas, setKoreanDramas] = useState<Media[]>([]);
  const [japaneseAnime, setJapaneseAnime] = useState<Media[]>([]);
  const [europeanCinema, setEuropeanCinema] = useState<Media[]>([]);
  // Platform/Provider
  const [youTubeOriginals, setYouTubeOriginals] = useState<Media[]>([]);
  const [hboMax, setHBOMax] = useState<Media[]>([]);
  const [peacock, setPeacock] = useState<Media[]>([]);
  const [crunchyroll, setCrunchyroll] = useState<Media[]>([]);

  useEffect(() => {
    const fetchAllContent = async () => {
      try {
        // Thematic/Curated
        const [trueStories] = await Promise.all([getBasedOnTrueStories()]);
        setBasedOnTrueStories(trueStories);

        // Genre-Based (Action row loads page 1 only here)
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
        setActionMovies(action);
        setComedyMovies(comedy);
        setDramaMovies(drama);
        setThrillerMovies(thriller);
        setSciFiMovies(scifi);
        setHorrorMovies(horror);
        setRomanceMovies(romance);
        setAnimationMovies(animation);
        setFamilyMovies(family);
        setDocumentaryMovies(documentary);
        setMysteryMovies(mystery);
        setFantasyMovies(fantasy);

        // Binge/For Kids
        const [binge, kids] = await Promise.all([
          getBingeWorthySeries(),
          getMoviesForKids(),
        ]);
        setBingeSeries(binge);
        setMoviesForKids(kids);

        // Regional/Language
        const [hollywood, bollywood, korean, anime, euro] = await Promise.all([
          getHollywoodMovies(),
          getBollywoodMovies(),
          getKoreanDramas(),
          getJapaneseAnime(),
          getEuropeanCinema(),
        ]);
        setHollywoodMovies(hollywood);
        setBollywoodMovies(bollywood);
        setKoreanDramas(korean);
        setJapaneseAnime(anime);
        setEuropeanCinema(euro);

        // Platform/Provider
        const [yt, hbo, pea, crun] = await Promise.all([
          getYouTubeOriginals(),
          getHBOMax(),
          getPeacock(),
          getCrunchyroll(),
        ]);
        setYouTubeOriginals(yt);
        setHBOMax(hbo);
        setPeacock(pea);
        setCrunchyroll(crun);
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
