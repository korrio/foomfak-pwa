export class MediaRecorderHelper {
  private mediaRecorder: MediaRecorder | null = null
  private stream: MediaStream | null = null
  private chunks: Blob[] = []

  async startRecording(options: { video?: boolean; audio?: boolean } = { audio: true }): Promise<boolean> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia(options)
      this.mediaRecorder = new MediaRecorder(this.stream)
      this.chunks = []

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.chunks.push(event.data)
        }
      }

      this.mediaRecorder.start()
      return true
    } catch (error) {
      console.error('Error starting recording:', error)
      return false
    }
  }

  async stopRecording(): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve(null)
        return
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, { 
          type: this.mediaRecorder?.mimeType || 'audio/webm' 
        })
        this.cleanup()
        resolve(blob)
      }

      this.mediaRecorder.stop()
    })
  }

  private cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop())
      this.stream = null
    }
    this.mediaRecorder = null
    this.chunks = []
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording'
  }
}

export const createMediaRecorder = () => new MediaRecorderHelper()