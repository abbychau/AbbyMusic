<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";

  export let min = 0;
  export let max = 100;
  export let value:number = 50;
  export let step:number = 1;
  export let valueContainerWidth = 70;
  export let displayValue = true;
  export let displayValueFactor = 1;
  export let title = "";
  const dispatch = createEventDispatcher();
  export let initialValue:number = 0;

  function handleChange(event: any) {
    value = event.target.value * 1;
    dispatch("change", value);
  }
</script>

<div style="display: flex; flex-direction: row; align-items: center;">
  {#if title}
    <label style="margin-right: 0.5em;">{title}</label>
  {/if}
  <input
    type="range"
    bind:value
    step={step}
    {min}
    {max}
    on:wheel={
      (event) => {
        event.preventDefault();
        value += (event.deltaY > 0 ? -step : step)
        // prevent 1.0000000000000002 or 0.9999999999999998 values
        // check decimal places
        const decimalPlaces = value.toString().split(".")[1]?.length || 0;
        if (decimalPlaces > 6) { //quick and dirty :D
          value = parseFloat(value.toFixed(2));
        }
        if (value < min) value = min;
        if (value > max) value = max;
        dispatch("change", value);
      }
    }
    class="slider"
    on:change={handleChange}
  />
  {#if displayValue}
    <span style={`margin-left: 0.5em; width: ${valueContainerWidth}px`}>
      {#if displayValueFactor !== 1}
        {Math.round(value * displayValueFactor)}
      {:else}
        {value}
      {/if}
    </span>
  {/if}
  <botton on:click={() => {
    value = initialValue;
    dispatch("change", value);
  
  }}>↻</botton>
  
</div>

<style>
  .slider {
    appearance: none;
    width: 100%;
    height: 15px;
    outline: 2px black solid;
    background: transparent;
    border-radius: 3px;
  }

  .slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 15px;
    height: 15px;
    background: black;
    cursor: pointer;
    border-radius: 3px;
  }
</style>
