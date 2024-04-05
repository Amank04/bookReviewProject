-- Table: public.books

-- DROP TABLE IF EXISTS public.books;

CREATE TABLE IF NOT EXISTS public.books
(
    id integer NOT NULL DEFAULT nextval('books_id_seq'::regclass),
    title text COLLATE pg_catalog."default" NOT NULL,
    author text COLLATE pg_catalog."default" NOT NULL,
    rating numeric NOT NULL,
    notes text COLLATE pg_catalog."default" NOT NULL,
    images bytea,
    date_read date NOT NULL,
    date_auto timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT books_pkey PRIMARY KEY (id),
    CONSTRAINT books_rating_check CHECK (rating >= 0::numeric AND rating <= 10::numeric)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.books
    OWNER to postgres;