package com.continuuity.data2.transaction;

import com.continuuity.data.engine.leveldb.KeyValue;
import com.google.common.base.Objects;

import java.util.Arrays;

/**
 *
 */
public class Transaction {
  private final long readPointer;
  private final long writePointer;
  private final long[] invalids;
  private final long[] inProgress;

  private static final long[] NO_EXCLUDES = { };
  public static final Transaction ALL_VISIBLE_LATEST =
    new Transaction(KeyValue.LATEST_TIMESTAMP, KeyValue.LATEST_TIMESTAMP, NO_EXCLUDES, NO_EXCLUDES);

  public Transaction(long readPointer, long writePointer, long[] invalids, long[] inProgress) {
    this.readPointer = readPointer;
    this.writePointer = writePointer;
    this.invalids = invalids;
    this.inProgress = inProgress;
  }

  public long getReadPointer() {
    return readPointer;
  }

  public long getWritePointer() {
    return writePointer;
  }

  public long[] getInvalids() {
    return invalids;
  }

  public long[] getInProgress() {
    return inProgress;
  }

  public long getFirstInProgress() {
    return inProgress.length == 0 ? Long.MAX_VALUE : inProgress[0];
  }

  public boolean isInProgress(long version) {
    return Arrays.binarySearch(inProgress, version) >= 0;
  }

  public boolean isExcluded(long version) {
    return Arrays.binarySearch(inProgress, version) >= 0
      || Arrays.binarySearch(invalids, version) >= 0;
  }

  public boolean isVisible(long version) {
    return version <= getReadPointer()
      && Arrays.binarySearch(inProgress, version) < 0
      && Arrays.binarySearch(invalids, version) < 0;
  }

  public boolean hasExcludes() {
    return invalids.length > 0 || inProgress.length > 0;
  }


  public int getNumberOfExcludes() {
    return invalids.length + inProgress.length;
  }


  @Override
  public String toString() {
    return Objects.toStringHelper(this)
                  .add("readPointer", readPointer)
                  .add("writePointer", writePointer)
                  .add("invalids", Arrays.toString(invalids))
                  .add("inProgress", Arrays.toString(inProgress))
                  .toString();
  }
}
