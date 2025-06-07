"use client";

export default function Header({ categories }: { categories: ICategory[] }) {
  return (
    <>
      <header className="nav">
        {categories.map((category) => (
          <a
            key={category.slug}
            href={`/category/${category.slug}`}
            className="nav-link"
            style={{
              backgroundImage: `linear-gradient(
              to right,
      rgba(60, 60, 60, 0.65), 
      rgba(192, 192, 192, 0.65)
    ),url(/api/v1/image/${category?.image?.url}?w=200&h=200)`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              backgroundColor: "#f0f0f0",
              borderRadius: "10px",
              color: "#fff",
              textDecoration: "none",
              border: "1px solid #ccc",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "flex-end",
              margin: "5px",
              width: "200px",
              height: "200px",
              // overflow: "hidden",
            }}
          >
            <div
              className=""
              style={{
                backdropFilter: "blur(2px)",
                borderRadius: "10px",
                padding: "10px",
                width: "100%",
                height: "100%",
              }}
            >
              {category.name}
              {category.children.length > 0
                ? ` (${category.children.length})`
                : ""}
            </div>

            {/* <Image
              alt=""
              src={"/api/v1/image/" + category?.image?.url + `?w=100&h=100`}
              placeholder="blur"
              blurDataURL={
                category?.image?.thumbnailUrl ||
                `/api/v1/image/${category?.image?.thumbnailUrl}?w=100&h=100`
              }
              width={100}
              height={100}
            /> */}
          </a>
        ))}
      </header>
    </>
  );
}
