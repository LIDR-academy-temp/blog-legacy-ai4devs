import Post from '#models/post'

export default class PostRepository {
  async buscarPublicadoPorSlug(slug: string) {
    return Post.query().where('slug', slug).where('estado', 'publicado').first()
  }
}
