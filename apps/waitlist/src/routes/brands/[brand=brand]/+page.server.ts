import { strings } from '$lib/brands/strings'
import { join } from '$lib/server/join'
import type { JoinFormProps } from '$lib/types/join-form-props'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = ({ locals }) => {
  const { brand } = locals
  const joinForm: JoinFormProps = {
    text: {
      heading: strings.form.heading,
      purpose: strings.form.purpose(brand),
      email: strings.form.email,
      submit: strings.form.submit,
      submitting: strings.form.submitting,
      trap: strings.form.trap,
      sentHeading: strings.form.sentHeading,
      sent: strings.form.sent,
      invalidEmail: strings.form.invalidEmail,
      rateLimited: strings.form.rateLimited
    }
  }
  return {
    meta: { title: brand.title, description: brand.description, path: '/', indexable: true },
    joinForm
  }
}

export const actions: Actions = { default: join }
