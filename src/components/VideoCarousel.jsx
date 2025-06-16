import React from 'react';
import { useRef, useState, useEffect } from 'react';
import { highlightsSlides } from '../constants';
import gsap from "gsap";
import { pauseImg, playImg, replayImg } from '../utils';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/all';
gsap.registerPlugin(ScrollTrigger);


export const VideoCarousel = () => {

  const videoRef = useRef([])
  const videoSpanRef = useRef([])
  const videoDivRef = useRef([])

  const [video, setVideo] = useState({
    isEnd: false,
    startPlay: false,
    videoId: 0,
    isLastVideo: false,
    isPlaying: false,
  })

  const [ loadedData, setLoadedData ] = useState([]);
  const { isEnd, startPlay, videoId, isLastVideo, isPlaying } = video;

  useGSAP(() => {
    // slider animation to move the video out of the screen and bring the next video in
    gsap.to('#slider', {
      transform: `translateX(${-100 * videoId }%)`,
      duration: 2,
      ease: 'power2.inOut', // show visualizer https://gsap.com/docs/v3/Eases
    });

    // video animation to play the video when it is in the view
    gsap.to('#video', {
      scrollTrigger: {
        trigger: '#video',
        toggleActions: 'restart none none none'
      },
      onComplete: () => {
        setVideo((prevVideo) => ({
          ...prevVideo,
          startPlay: true,
          isPlaying: true
        }));
      }
    });
  }, [isEnd ,videoId]);

  useEffect(() => {
    if(loadedData.length > 3){
      if(!isPlaying){
        videoRef.current[videoId].pause();
      } 
      else{
        startPlay && videoRef.current[videoId].play();
      }
    }
  }, [startPlay, videoId, isPlaying, loadedData]);

  const handleLoadedMetadata = (i, e) => setLoadedData((prevVideo) => [...prevVideo, e]);

  useEffect(() => {
    let currentProgress = 0;
    let span = videoSpanRef.current;

    if(span[videoId]){
      // animation to move the indicator
      let anim = gsap.to(span[videoId], {
        onUpdate: () => {
          // get the progress of the video
          const progress = Math.ceil(anim.progress() * 100);
          
          if(progress != currentProgress){
            currentProgress = progress;

            // set the width of the progress bar
            gsap.to(videoDivRef.current[videoId], {
              width: window.innerWidth < 760 
                ? '10vw'  //mobile
                : window.innerWidth < 1200
                ? '10vw'  //tablet
                : '4vw',  //laptop
            });

            // set the background color of the progress bar
            gsap.to(span[videoId], {
              width: `${currentProgress}%`,
              backgroundColor: 'white',
            });
          }

        },
        // when the video is ended, replace the progress bar with the indicator and change the background color
        onComplete: () => {
          if(isPlaying){
            gsap.to(videoDivRef.current[videoId], {
              width: '12px',
            });
            gsap.to(span[videoId], {
              backgroundColor: '#afafaf',
            });
          }

        },
      });

      if(videoId === 0){
        anim.restart();
      }

      // update the progress bar
      const animUpdate = () => {
        anim.progress(videoRef.current[videoId].currentTime / highlightsSlides[videoId].videoDuration)
      }

      // ticker to update the progress bar
      if(isPlaying){
        gsap.ticker.add(animUpdate)
      }
      // remove the ticker when the video is paused (progress bar is stopped)
      else{
        gsap.ticker.remove(animUpdate)
      }

    }

  }, [videoId, startPlay])

  // vd id is the id for every video until id becomes number 3
  const handleProcess = (type, i) => {
    switch (type) {
      case 'video-end':
        setVideo((prevVideo) => ({...prevVideo, isEnd: true, videoId: i + 1 }))
        break;

      case 'video-last':
        setVideo((prevVideo) => ({...prevVideo, isLastVideo: true}))
        break;

      case 'video-reset':
        setVideo((prevVideo) => ({...prevVideo, isLastVideo: false, videoId: 0}))
        break;
        
      case 'play':
        setVideo((prevVideo) => ({...prevVideo, isPlaying: !prevVideo.isPlaying}))  
      break;

      case 'pause':
        setVideo((prevVideo) => ({...prevVideo, isPlaying: !prevVideo.isPlaying}))  
      break;

      default:
        return video;
    }
  }

  return (
    <>
        <div className='flex items-center'>
            {highlightsSlides.map((list, i) => (
                <div key={list.id} id="slider" className="sm:pr-20 pr-10">
                    <div className="video-carousel_container">
                      <div className="bg-black w-full h-full rounded-3xl flex-center overflow-hidden">
                        <video
                        id="video"
                        playsInline={true}
                        preload='auto'
                        muted
                        className={`${list.id === 2 && 'translate-x-44'} pointer-events-none`}
                        ref={(el) => (videoRef.current[i] = el)}
                        onEnded={() => i !== 3
                          ? handleProcess('video-end', i)
                          : handleProcess('video-last')
                        }
                        onPlay={() => {
                          setVideo((prevVideo) => ({
                            ...prevVideo, isPlaying: true
                          }))
                        }}
                        onLoadedMetadata={(e) => handleLoadedMetadata(i, e)}
                        >
                          <source src={list.video} type="video/mp4"/>
                        </video>
                      </div>

                      <div className="absolute top-12 left-[5%] z-10">
                        {list.textLists.map((text) => (
                          <p key={text} className="md:text-2xl text-xl font-medium">
                            {text}
                          </p>
                        ))}
                      </div>
                    </div>
                </div>
            ))}
        </div>

        <div className="relative flex-center mt-10">
            <div className="py-5 px-7 flex-center rounded-full bg-gray-300 backdrop-blur">
              {videoRef.current.map((_, i) => (
                <span
                key={i}
                ref={(el) => (videoDivRef.current[i] = el)}
                className="mx-2 w-3 h-3 bg-gray-200 rounded-full relative cursor-pointer"
                >
                  <span
                  className="absolute h-full w-full rounded-full"
                  ref={(el) => (videoSpanRef.current[i] = el)}
                  />
                </span>
              ))}
            </div>
            <button className="control-btn">
              <img
              src={isLastVideo ? replayImg : !isPlaying ? playImg : pauseImg}
              alt={isLastVideo ? 'replay' : !isPlaying ? 'play' : 'pause'}
              onClick={isLastVideo 
                ? () => handleProcess('video-reset')
                : !isPlaying 
                  ? () => handleProcess('play')
                  : () => handleProcess('pause')}
              />
            </button>
        </div>
    </>
  )
}
