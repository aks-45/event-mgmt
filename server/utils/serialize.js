/** Map Prisma records to API shape (Mongo-style _id for frontend compatibility). */
export const toApiDoc = (doc) => {
  if (doc == null) return doc;
  if (Array.isArray(doc)) return doc.map(toApiDoc);

  const { id, verifiedBy, performedBy, participant, ...rest } = doc;
  const out = { _id: id, ...rest };

  if (verifiedBy && typeof verifiedBy === 'object') {
    out.verifiedBy = {
      _id: verifiedBy.id,
      name: verifiedBy.name,
      email: verifiedBy.email,
    };
  }

  return out;
};
