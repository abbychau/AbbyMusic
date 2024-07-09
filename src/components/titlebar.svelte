<script lang="ts">
  import { appWindow } from "@tauri-apps/api/window";
</script>

<div data-tauri-drag-region class="titlebar">
  <div class="titlebar-title" data-tauri-drag-region>
    <slot></slot>
  </div>
  <div class="titlebar-button" on:click={() => appWindow.minimize()}>
    <span>⚊</span>
  </div>
  <div class="titlebar-button" on:click={() => appWindow.toggleMaximize()}>
    <span>☐</span>
  </div>
  <div class="titlebar-button close-button" on:click={() => appWindow.close()}>
    <span>☓</span>
  </div>
</div>

<style>
  
  :global(:root) {
    --titlebar-height: 22px;
    /*disable font smoothing*/
    -webkit-font-smoothing: none;
    font-smoothing: never;
  }

  .titlebar {
    font-size: 14px;
    color: white;
    height: var(--titlebar-height);
    background: #000000;
    user-select: none;
    display: flex;
    justify-content: flex-end;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    border-radius: 5px 5px 0 0;
  }
  .titlebar-title {
    /*single line title*/
    white-space: nowrap;
    flex: 1;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    padding-left: 10px;
  }
  .titlebar-button {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    width: var(--titlebar-height);
    height: var(--titlebar-height);
  }
  .titlebar-button:hover {
    background: #5bbec3;
  }
  .close-button {
    border-radius: 0 5px 0 0;
  }
</style>
