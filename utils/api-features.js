class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString }; // destruction of an object to another one
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // advanced filtering : to add a comparaison functionality to the query you simply add domain/path?filterField[gte|gt|lt|lte]=value...
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));

    return this; // returns the whole object
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = req.query.sort.split('+').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('name');
    }

    return this;
  }

  limit() {
    if (this.queryString.fields) {
      const select = this.queryString.fields.split('+').join(' ');
      this.query = this.query.select(select); //projection
    } else {
      this.query = this.query.select('-__v'); // - excluds fields
    }

    return this;
  }

  paginate() {
    const page = +this.queryString.page || 1;
    const limit = +this.queryString.limit || 9;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    // if (this.queryString.page) {
    //   const nbTours = await Tour.countDocuments(); // returns how much document in the collection
    //   if (skip >= nbTours) throw new Error('PAGE DOES NOT EXIST!');
    // }

    return this;
  }
}

module.exports = APIFeatures;
