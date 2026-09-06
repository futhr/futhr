<script lang="ts">
  import { enhance } from '$app/forms'
  import type { JoinFormProps } from '$lib/types/join-form-props'

  let { text, result }: JoinFormProps = $props()

  let pending = $state(false)

  const joined = $derived(result?.joined === true)
  const message = $derived.by(() => {
    if (result?.error === 'invalid_email') {
      return text.invalidEmail
    }
    if (result?.error === 'rate_limited') {
      return text.rateLimited
    }
    return ''
  })
</script>

{#if joined}
  <div role="status" class="flex flex-col items-center gap-5">
    <h2
      class="m-0 pl-[0.35em] text-(length:--label-size) leading-none font-extrabold tracking-[0.35em] uppercase"
    >
      {text.sentHeading}
    </h2>
    <p class="m-0 max-w-[36ch] text-(length:--body-size) leading-[1.6] text-muted">{text.sent}</p>
  </div>
{:else}
  <!-- A plain form post works without JavaScript; enhance() keeps the result on the page. -->
  <form
    class="flex w-full max-w-[32rem] flex-col items-center gap-6"
    method="POST"
    novalidate
    aria-labelledby="join-form-heading"
    aria-describedby="join-form-purpose"
    use:enhance={() => {
      pending = true
      return async ({ update }) => {
        try {
          await update({ reset: false })
        } finally {
          pending = false
        }
      }
    }}
  >
    <h2
      id="join-form-heading"
      class="m-0 pl-[0.35em] text-(length:--label-size) leading-none font-extrabold tracking-[0.35em] uppercase"
    >
      {text.heading}
    </h2>
    <p
      id="join-form-purpose"
      class="m-0 max-w-[36ch] text-(length:--body-size) leading-[1.6] text-muted"
    >
      {text.purpose}
    </p>
    <div class="flex w-full gap-3 @max-md:flex-col">
      <label class="sr-only" for="join-form-email">{text.email}</label>
      <input
        id="join-form-email"
        name="email"
        type="email"
        required
        autocomplete="email"
        inputmode="email"
        spellcheck="false"
        enterkeyhint="send"
        maxlength="254"
        placeholder={text.email}
        aria-invalid={result?.error === 'invalid_email' || undefined}
        aria-describedby={message ? 'join-form-error' : undefined}
        disabled={pending}
        class="h-14 min-w-0 grow border border-paper/25 bg-paper/5 px-4 text-(length:--body-size) text-paper outline-none placeholder:text-muted focus-visible:border-signal focus-visible:outline-none disabled:opacity-60"
      >
      <!-- A hidden field catches bots that fill every input. -->
      <div class="hidden" aria-hidden="true">
        <label for="join-form-website">{text.trap}</label>
        <input id="join-form-website" name="website" type="text" tabindex="-1" autocomplete="off">
      </div>
      <button
        type="submit"
        disabled={pending}
        class="h-14 shrink-0 cursor-pointer border-0 bg-paper px-7 text-(length:--body-size) font-extrabold text-ink transition-colors duration-150 hover:bg-signal-light focus-visible:bg-signal-light focus-visible:outline-paper disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none"
      >
        {pending ? text.submitting : text.submit}
      </button>
    </div>
    <p
      id="join-form-error"
      role="alert"
      class="m-0 min-h-[1.5em] text-(length:--body-size) font-semibold text-signal-light"
    >
      {message}
    </p>
  </form>
{/if}
