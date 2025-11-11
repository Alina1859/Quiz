export interface Submission {
  id: number
  name: string
  phone: string
  ipAddress: string
  userAgent: string | null
  fingerprint: any | null
  fingerprintData: any | null
  recaptchaVerified: boolean | null
  createdAt: string
  answers: {
    answers: Array<{
      questionId: number
      questionText: string
      questionNumber: number
      answer: string
    }>
    name: string
    contactMethod: string
  } | null
}

export interface CardAnswersProps {
  isLoadingSubmissions: boolean
  submissions: Submission[]
}

export interface CardDataProps {
  isLoadingSubmissions: boolean
  submissions: Submission[]
}

export interface QuestionDrafts {
  [questionId: number]: string | undefined
}

export interface OptionDrafts {
  [key: string]: string | undefined
}

export interface NewOptionDrafts {
  [questionId: number]: string | undefined
}
