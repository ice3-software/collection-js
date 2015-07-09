
/**
 * @name Collection
 *
 * @description
 * A collection extends an array with paginated loading methods. This
 * allows you to neatly bind a `query` function to the array and call
 * its `loadMore` or `refresh` methods without having to maintain it's
 * state imperatively.
 *
 * @example
 *
 *   $scope.users = new Collection(function(offset) {
 *     return UserService.find(offset);
 *   });
 *  ...
 *
 *  <div class="isa-page" ng-class="{
 *    'loading-style': users.loadingState === 'loading',
 *    'failed-style': users.loadingState === 'failed'
 *  }" infinite-scroll="users.loadMore()">
 *  ...
 *  </div>
 *
 * @constructor
 *   @param  query  	Function(Number) Promise
 *   @param  loadNow  Boolean
 *
 * @extends Array
 * @author Steve Fortune
 */
(function() {

  'use strict';

  var Collection = function(query, loadNow) {

    /**
     * @public
     * @deprecated We've found a way to inherit from the native
     * Array object. See here:
     * https://github.com/Urigo/angular-meteor/blob/master/modules/angular-meteor-collections.js#L14
     * @var Array
     */
    this.arr = this;

    /**
     * @protected
     * @var Function(Number)
     */
    this.query = query;

    /**
     * The state of the collection whilst loading.
     *
     * @protected
     * @var String: 'loading' | 'loaded' | 'failed'
     */
    this.loadingState;

    /**
     * Current promised used for loading more.
     *
     * @protected
     * @var Promise
     */
    this.moreQ;

    if (typeof loadNow === 'undefined' || loadNow) {
      this.refresh();
    }

  };

  Collection.prototype = [];

  /**
   * Loads more items into the collection by calling the query.
   *
   * @note  The obj returned by the Promise has the following
   *       key / vals:
   *      - items: Array, the new recently added items
   *       - oldLength: The previous length of the collection
   *       - newLength: The new length of the collection
   *       - firstSuccessfulQuery: A boolean indicating whether
   *         this was the first successful load of the
   *        collection.
   * @return   Promise
   */
  Collection.prototype.more = function() {

    var col = this;
    if (col.moreQ) {
      return col.moreQ;
    }

    var lenBef = col.length;
    var stateBef = col.loadingState;

    col.moreQ = col.query(lenBef).then(function(items) {
      Array.prototype.push.apply(col, items);
      var lenAf = col.length;
      col.loadingState = 'loaded';
      return {
        items: items,
        oldLength: lenBef,
        newLength: lenAf,
        firstSuccessfulQuery: stateBef === 'loading' && lenAf > 0
      };
    }, function(err) {
      col.loadingState = 'failed';
      return err;
    }).finally(function() {
      col.moreQ = null;
    });

    return col.moreQ;

  };


  /**
   * Clears the collection and starts its loading again
   *
   * @return Promise
   */
  Collection.prototype.refresh = function() {
    this.length = 0;
    this.loadingState = 'loading';
    return this.more();
  };

})();
