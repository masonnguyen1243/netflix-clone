import { getMovieById } from "@/lib/movieData";

export async function GET(
  _: Request,
  { params }: { params: { id: string } }
) {
  const movie = await getMovieById(params.id);

  if (!movie) {
    return Response.json(
      { error: "Không tìm thấy phim", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  return Response.json({ data: movie });
}
