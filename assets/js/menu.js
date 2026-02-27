"use strict";

class Menu {
  constructor(initialItems, incrementLoad) {
    // The current number of items, after possibly loading more.
    this.numItems = 0;
    // The number of items after to be loaded after the initialization.
    this.initialItems = initialItems;
    // The increment over the current number of items when the 'Load more'
    // button is pressed.
    this.incrementLoad = incrementLoad;

    // The currently active filter.
    this.curFilter = "all";
  }

  setup(itemsId, popUpsId) {
    // Frequently used DOM items.
    this.container = document.querySelector(".shuffle-wrapper");
    this.allInputs = Array.from(
      document.querySelectorAll('input[name="shuffle-filter"]'),
    );
    this.toggableFilters = document.querySelectorAll(
      '.menu-filter:not([filter-level="1"])',
    );
    this.noItemsMsg = document.getElementById("no-items-msg");
    this.loadMoreBtn = document.getElementById("load-more-btn");

    this.setupShuffle();
    this.setupListeners();
    this.setupItems(itemsId, popUpsId);
  }

  setupShuffle() {
    // Initializing Shuffle.js
    //
    // NOTE: a bug in Shuffle causes cards to not be set to `visibility:
    // hidden` when `useTransforms` is disabled, supposedly recommended for
    // performance gains.
    this.shuffle = new window.Shuffle(this.container, {
      itemSelector: ".shuffle-item",
      buffer: 1,
      // useTransforms: false
    });

    // Lazy loading also works with Shuffle js to refresh the layout when
    // the images are loaded to avoid them overlapping.
    Array.from(document.getElementsByClassName("lozad")).forEach((img) =>
      img.addEventListener("load", () => this.shuffle.layout()),
    );
  }

  setupListeners() {
    // The hidden levels will appear and disappear depending on its
    // parents.
    this.allInputs.forEach((item) => {
      item.addEventListener("click", (e) => this.onInputClick(e));
    });

    this.loadMoreBtn.addEventListener("click", (e) => {
      this.onLoadMoreClicked(e);
    });
  }

  setupItems(itemsId, popUpsId) {
    this.items = Array.from(document.getElementById(itemsId).children);

    this.items.forEach((element) => {
      this.shuffle.element.appendChild(element);
    });

    this.shuffle.add(this.items);
    this.shuffle.filter((_) => false);
  }

  // Returns the bar inside a filter
  getBar(filter) {
    return filter.children[1];
  }

  // Checks if a bar contains a child with the provided filter value.
  barContains(bar, value) {
    return Array.from(bar.children).some(
      (i) => i.children[0].getAttribute("filter-value") === value,
    );
  }

  // Resets the status of the filter.
  resetFilter(filter) {
    function deactivate(el) {
      el.classList.remove("active");
      el.classList.checked = false;
    }
    function activate(el) {
      el.classList.add("active");
      el.classList.checked = true;
    }

    // Remove all active buttons. There should only be one of them
    // checked beforehand.
    //
    // Also default back to the first option (it's always going to be
    // the first child).
    //
    let bar = this.getBar(filter);
    let active = Array.from(bar.children).find((i) =>
      i.classList.contains("active"),
    );
    let inactive = bar.children[0];
    deactivate(active);
    activate(inactive);
  }

  hideFilter(filter) {
    const filterJQ = $(filter);
    if (filterJQ.is(":hidden")) {
      return;
    }

    this.resetFilter(filter);

    // Fade out with an animation
    filterJQ.css("opacity", 1);
    filterJQ.addClass("d-none");
    filterJQ.animate({ opacity: 0 }, 400);
  }

  // Requires JQuery for animations
  showFilter(filter) {
    const filterJQ = $(filter);
    if (!filterJQ.is(":hidden")) {
      return;
    }

    // Fade in with an animation
    filterJQ.css("opacity", 0);
    filterJQ.removeClass("d-none");
    filterJQ.animate({ opacity: 1 }, 400);
  }

  // Automatically scrolling to the next filter
  scrollTo(item) {
    const htmlAndBody = $("html, body");
    htmlAndBody.animate(
      {
        scrollTop: $(item).offset().top - 90,
      },
      500,
    );
  }

  // Updating all the displayed rows.
  updateFilters(curBar, curParent, curFilter) {
    this.toggableFilters.forEach((filter) => {
      const filterParent = filter.getAttribute("filter-parent");
      let bar = this.getBar(filter);

      // Every bar will be hidden except for itself, its first
      // child bar and its parents, respectively
      const isSelf = bar === curBar;
      const isChild = filterParent === curFilter;
      const isParent = this.barContains(bar, curParent);
      if (isSelf || isChild || isParent) {
        this.showFilter(filter);

        // If it's a child bar it's automatically scrolled to it
        if (isChild) {
          this.scrollTo(filter);
        }

        // The child will be resetted (this is important for
        // whenever the same parent item is pressed).
        if (filterParent === curFilter) {
          this.resetFilter(filter);
        }
      } else {
        // The bar will fade out if it isn't already hidden.
        this.hideFilter(filter);
      }
    });
  }

  // Classify the items given a new filter.
  updateItems(filter) {
    // A new filter will reset the number of items to the initial value.
    if (this.curFilter !== filter) {
      this.numItems = this.initialItems;
      this.curFilter = filter;
    }

    // Filtering the items with the new selected button.
    let numMatches = 0;
    this.shuffle.filter((item) => {
      // If it matches any of the data groups, it's accepted.
      // But it will only be shown if the limit hasn't been reached.
      const dataGroups = JSON.parse(item.getAttribute("data-groups"));
      if (filter === "all" || dataGroups.some((field) => field === filter)) {
        numMatches++;
        if (numMatches <= this.numItems) {
          return true;
        }
      }

      return false;
    });

    this.shuffle.update();

    // If no items matched, a custom message is shown.
    if (numMatches === 0) {
      this.noItemsMsg.classList.remove("d-none");
    } else {
      this.noItemsMsg.classList.add("d-none");
    }

    // If the limit was reached, a button will let the user load more items.
    if (numMatches <= this.numItems) {
      this.loadMoreBtn.classList.add("d-none");
    } else {
      this.loadMoreBtn.classList.remove("d-none");
    }
  }

  onInputClick(e) {
    // The pressed button, and the bar it's in.
    const clickedInput = e.currentTarget;
    const clickedFilter = clickedInput.getAttribute("filter-value");
    const clickedBar = clickedInput.parentNode.parentNode;
    const clickedParent = clickedBar.parentNode.getAttribute("filter-parent");

    this.updateFilters(clickedBar, clickedParent, clickedFilter);
    this.updateItems(clickedFilter);
  }

  onLoadMoreClicked(e) {
    this.numItems += this.incrementLoad;
    this.updateItems(this.curFilter);
  }
}

window.Menu = Menu;
