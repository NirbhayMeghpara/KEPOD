export interface SQSMessageBody {
  env_id: string
  env_name: string
  image: string
  ttl: number
  namespace: string
  targetPort: number
}
