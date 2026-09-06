<script lang="ts">
  import { strings } from '$lib/brands/strings'
  import EmailForm from '$lib/components/email-form.svelte'
  import type { JoinFormProps } from '$lib/types/join-form-props'

  let { text, result }: JoinFormProps = $props()
</script>

<div class="flex w-full flex-col items-center gap-4">
  <EmailForm id="join-form" {text} result={{ complete: result?.joined, error: result?.error }} />
  <p class="m-0 max-w-[36ch] text-sm leading-[1.6] text-muted">
    {strings.form.consent}
    <a href="/privacy" class="text-paper underline underline-offset-4"
      >{strings.form.privacyNotice}</a
    >.
    <a href="/withdraw" class="text-paper underline underline-offset-4">{strings.withdraw.link}</a>
    {strings.form.withdrawAnytime}
  </p>
</div>
