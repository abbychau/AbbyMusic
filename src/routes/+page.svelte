<script lang="ts">
  
  import { open } from "@tauri-apps/api/dialog";
  import { convertFileSrc } from "@tauri-apps/api/tauri";
  //tauri fs (so to read files in folder)
  import { readDir } from "@tauri-apps/api/fs";

  import Slider from "../components/slider.svelte";
  import Titlebar from "../components/titlebar.svelte";
  import { onMount } from "svelte";
  import {
    extractFileName,
    getFilesMusicMetas,
    musicExtensions,
  } from "../utils";
  //tauri on resize callback
  // import { appWindow, LogicalSize } from "@tauri-apps/api/window";
  // appWindow.onResized((e) => {
  //   //check sidebar size, and limit window size so that it won't be smaller than sidebar
  //   const sidebar = document.querySelector(".sidebar");
  //   if (sidebar) {
  //     const rect = sidebar.getBoundingClientRect();
  //     const logicalSize = new LogicalSize(
  //       Math.max(e.payload.width, rect.width),
  //       Math.max(e.payload.height, rect.height),
  //     );
  //   }
  // });
  // import NodeID3 from "node-id3";

  let musicMetas: {
    fileUrl: string;
    fileName: string;
  }[] = [];
  let commonPrefix = "";
  //when musicMetas changes, save to local storage
  $: if (musicMetas) {
    //for each fileName in musicMetas, find the common prefix
    commonPrefix = musicMetas.reduce((acc, meta) => {
      const fileName = meta.fileName;
      if (acc === "") {
        return fileName;
      }
      let i = 0;
      while (i < acc.length && i < fileName.length && acc[i] === fileName[i]) {
        i++;
      }
      return acc.slice(0, i);
    }, "");
    //if last one is ( , remove it
    if (commonPrefix[commonPrefix.length - 1] === "(") {
      commonPrefix = commonPrefix.slice(0, -1);
    }

    //trim the trailing spaces and hyphens
    commonPrefix = commonPrefix.replace(/[\s-_0]+$/, "");

    //if commonPrefix is not empty, remove it from the beginning of each fileName
    if (commonPrefix.length > 2) {
      musicMetas = musicMetas.map((meta) => {
        let fileName = meta.fileName
          .slice(commonPrefix.length)
          .replace(/^[\s-_0]+/, "");
        //remove extension
        fileName = fileName.replace(/\.[^.]*$/, "");
        return {
          ...meta,
          fileName: fileName,
        };
      });
    } else {
      commonPrefix = "";
    }
  }
  $: if (repeatMode) {
    localStorage.setItem("repeatMode", repeatMode);
  }
  async function load() {
    // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
    await openFile();
  }

  async function loadFolder() {
    const selectedFolder = (await open({
      directory: true,
    })) as string | undefined;
    if (selectedFolder) {
      let files = await readDir(selectedFolder);
      const musicMetas = getFilesMusicMetas(files);
      localStorage.setItem("musicMetas", JSON.stringify(musicMetas));
    }
  }
  async function openFile() {
    // Open a selection dialog for image files
    const selected = (await open({
      multiple: true,
      filters: [
        {
          name: "All Music Files",
          extensions: musicExtensions,
        },
      ],
    })) as string[] | undefined;

    // read the file using fs
    if (selected) {
      musicMetas = selected.map((file) => {
        const fileUrl = convertFileSrc(file);
        const fileName = extractFileName(file);
        return {
          fileUrl,
          fileName,
        };
      });
      localStorage.setItem("musicMetas", JSON.stringify(musicMetas));
    }
  }
  onMount(() => {
    const speedString = localStorage.getItem("speed");
    if (speedString) {
      speed = parseFloat(speedString);
    }
    const volumeString = localStorage.getItem("volume");
    if (volumeString) {
      volume = parseFloat(volumeString);
    }    
    repeatMode = localStorage.getItem("repeatMode") || "all";
    const musicMetasString = localStorage.getItem("musicMetas");
    if (musicMetasString) {
      musicMetas = JSON.parse(musicMetasString);
    }

    nowPlayingFilePath = localStorage.getItem("nowPlayingFilePath") || "";
    if (nowPlayingFilePath) {
      song.src = nowPlayingFilePath;
    }
    const songCurrentTime = localStorage.getItem("songCurrentTime");
    if (songCurrentTime) {
      song.currentTime = parseFloat(songCurrentTime);
    }

    const isPlaying = localStorage.getItem("isPlaying");
    if (isPlaying === "true") {
      song.play();
    }
  });
  let song: HTMLAudioElement;
  let nowPlayingFilePath = "";
  let currentTime = "";
  let duration = "";
  let isPaused = true;

  function secondToTime(second: number) {
    const minutes = Math.floor(second / 60);
    const seconds = Math.floor(second % 60);
    //make sure seconds is 2 digits
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }
  function stopPlaying() {
    song.pause();
    song.currentTime = 0;
    nowPlayingFilePath = "";
    song.src = "";
  }
  setInterval(() => {
    if (song) {
      localStorage.setItem("volume", volume.toString());
      localStorage.setItem("speed", speed.toString());
      localStorage.setItem("nowPlayingFilePath", nowPlayingFilePath);
      localStorage.setItem("songCurrentTime", song.currentTime.toString());
      isPaused = song.paused;
      localStorage.setItem("isPlaying", isPaused ? "false" : "true");
      //if song ended, play next song
      if (song.currentTime === song.duration) {
        song.pause();
        song.currentTime = 0;
        //match nowPlayingFilePath in musicMetas so to find the next song
        const nowPlayingIndex = musicMetas.findIndex(
          (meta) => meta.fileUrl === nowPlayingFilePath,
        );

        if (repeatMode == "none") {
          stopPlaying();
          return;
        }
        let nextSong;
        if (repeatMode == "one") {
          nextSong = musicMetas[nowPlayingIndex];
        }
        if (repeatMode == "all") {
          let nextIndex = nowPlayingIndex + 1;
          if (nextIndex >= musicMetas.length) {
            nextIndex = 0;
          }
          nextSong = musicMetas[nextIndex];
        }

        if (nowPlayingIndex !== -1) {
          if (nextSong) {
            nowPlayingFilePath = nextSong.fileUrl;
            song.src = nextSong.fileUrl;
            song.volume = volume;
            song.play();
          }
        }
      }
    }
  }, 1000);
  let repeatMode = "none"; //none, one, all
  let volume:number = 1.0;
  let speed:number = 1.0;
  
  $: if (volume) {
    if (song){
      song.volume = volume;
    }
    
  }
  $: if (speed) {
    if (song){
      song.playbackRate = speed;
    }
    
  }
  let songTitle = "";
</script>

<div id="app">
  <audio style="display:none" id="song" bind:this={song} on:timeupdate={
    ()=>{
      
      currentTime = secondToTime(song.currentTime);
      duration = secondToTime(song.duration);
    }
  }></audio>
  <Titlebar>♬ AbbyMusic</Titlebar>
  <div class="mainWindow">
    <div class="topbar">
      
      <Slider bind:value={volume} max={1} min={0} step={0.01} displayValueFactor={100} initialValue={1.0} title="Vol" />
      <Slider bind:value={speed} max={16.0} min={0.07} step={0.01} displayValueFactor={1} initialValue={1.0} title="Spd" />
    </div>
    <div class="sidebar">

      <h2>{commonPrefix}</h2>
      {#each musicMetas as meta}
        <div
          class="song"
          on:click={() => {
            if (nowPlayingFilePath !== meta.fileUrl) {
              nowPlayingFilePath = meta.fileUrl;
              song.src = meta.fileUrl;
              song.volume = volume;
              song.play();
            }
          }}
        >
          {nowPlayingFilePath === meta.fileUrl? "▶" : "▷"}
          {meta.fileName}
        </div>
      {/each}
    </div>
    <div class="bottomBar">
      <span class="song">
        {#if nowPlayingFilePath && duration}
          {currentTime} / {duration}
        {:else}
          No song selected
        {/if}
      </span>

      <button on:click={load}>⏏ Load</button>
      <button on:click={loadFolder}>⛩ Folder</button>

      <button
        style="width:70px"
        on:click={() => {
          if (repeatMode === "none") {
            repeatMode = "one";
          } else if (repeatMode === "one") {
            repeatMode = "all";
          } else {
            repeatMode = "none";
          }
        }}
      >
        {#if repeatMode === "none"}
          ⇎ None
        {:else if repeatMode === "one"}
          ① One
        {:else}
          ↻ All
        {/if}
      </button>
      <button
        on:click={() => {
          stopPlaying();
        }}>⏹ Stop</button
      >
      {#if isPaused}
        <button
          on:click={() => {
            //if song src is empty, play the first song
            if (!song.src && musicMetas.length > 0) {
              nowPlayingFilePath = musicMetas[0].fileUrl;
              song.src = musicMetas[0].fileUrl;
            }
            song.play();
            isPaused = !isPaused;
          }}>⏵ Play</button
        >
      {:else}
        <button
          on:click={() => {
            song.pause();
            isPaused = !isPaused;
          }}>⏸ Pause</button
        >
      {/if}
    </div>
  </div>
</div>

<style>


  * {
    cursor: default;
    /*unselectable*/
    user-select: none;
  }
  .bottomBar {
    display: flex;
    position: fixed;
    bottom: 0;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    
  }
  .bottomBar > * {
    margin: 3px;
    font-size: 0.8rem;
    white-space: nowrap;
    --border-width: 2px;
    border: var(--border-width) solid black !important;
    clip-path: polygon(
      0 var(--border-width),
      var(--border-width) var(--border-width),
      var(--border-width) 0,
      calc(100% - var(--border-width)) 0,
      calc(100% - var(--border-width)) var(--border-width),
      100% var(--border-width),
      100% calc(100% - var(--border-width)),
      calc(100% - var(--border-width)) calc(100% - 2px),
      calc(100% - var(--border-width)) 100%,
      var(--border-width) 100%,
      var(--border-width) calc(100% - var(--border-width)),
      0 calc(100% - var(--border-width))
    ) !important;
  }
  .song {
    margin-right: 10px;
  }
  
  .bottomBar > span {
    padding-inline: 6px;
    padding-block: 1px;
    min-width: 75px;
    /*single line*/
  }
  /* pressed effect */
  .bottomBar > button:active {
    /*transform x and y for 1 px*/
    transform: translate(1px, 1px);
  }
  #app {
    border-radius: 50px;
    height: 100vh;
    background-color: #f3f3f3;
    border-radius: 5px;
  }
  .sidebar .song {
    /*single line*/
    white-space: nowrap;
  }
  .sidebar {
    padding: 0px 2px 2px 2px;
    margin: 5px;
    scrollbar-color: black transparent;
    scrollbar-width: thin;
    display: flex;
    flex-direction: column;
    justify-content: center;
    height: calc(100vh - 110px);
    overflow-y: auto;
    font-size: 0.8rem;
    --border-width: 2px;
    border: var(--border-width) solid black !important;
    clip-path: polygon(
      0 var(--border-width),
      var(--border-width) var(--border-width),
      var(--border-width) 0,
      calc(100% - var(--border-width)) 0,
      calc(100% - var(--border-width)) var(--border-width),
      100% var(--border-width),
      100% calc(100% - var(--border-width)),
      calc(100% - var(--border-width)) calc(100% - 2px),
      calc(100% - var(--border-width)) 100%,
      var(--border-width) 100%,
      var(--border-width) calc(100% - var(--border-width)),
      0 calc(100% - var(--border-width))
    ) !important;
  }
  .mainWindow {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
  }
</style>
